/**
 * ldapService.js
 * Real Active Directory LDAP integration — uztmk.local / AD-TMK
 * Library: ldapts (Promise-based, modern LDAP client)
 *
 * Pattern: Try real AD-TMK first → on failure, return null → controller falls back to DB
 */

const { Client, Attribute, Change } = require('ldapts');

// ── Config (from .env) ───────────────────────────────────────────────────────
const LDAP_URL      = process.env.LDAP_URL      || 'ldap://192.168.1.1:389';
const LDAP_BASE_DN  = process.env.LDAP_BASE_DN  || 'DC=uztmk,DC=local';
const LDAP_BIND_DN  = process.env.LDAP_BIND_DN  || 'CN=Administrator,CN=Users,DC=uztmk,DC=local';
const LDAP_PASSWORD = process.env.LDAP_PASSWORD || '';
const LDAPS_URL     = process.env.LDAPS_URL     || 'ldaps://192.168.1.1:636';

// ── Internal: get authenticated LDAP client ──────────────────────────────────
async function getClient() {
  const client = new Client({
    url: LDAP_URL,
    timeout: 5000,
    connectTimeout: 5000,
    tlsOptions: { rejectUnauthorized: false },
  });
  await client.bind(LDAP_BIND_DN, LDAP_PASSWORD);
  return client;
}

// ── Health check: is AD-TMK reachable? ──────────────────────────────────────
exports.isADAvailable = async () => {
  let client;
  try {
    client = await getClient();
    return true;
  } catch {
    return false;
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Search all users inside a given OU DN ────────────────────────────────────
// Returns array of user objects, or null if AD unreachable
exports.searchUsersInOU = async (ouDN) => {
  let client;
  try {
    client = await getClient();
    const { searchEntries } = await client.search(ouDN, {
      scope: 'sub',
      filter: '(&(objectClass=user)(objectCategory=person))',
      attributes: [
        'sAMAccountName', 'displayName', 'cn', 'mail',
        'telephoneNumber', 'title', 'department',
        'userAccountControl', 'lastLogon', 'distinguishedName',
      ],
    });
    return searchEntries.map(e => ({
      adLogin:   String(e.sAMAccountName || ''),
      fullName:  String(e.displayName || e.cn || ''),
      email:     String(e.mail || ''),
      phone:     String(e.telephoneNumber || ''),
      position:  String(e.title || ''),
      department:String(e.department || ''),
      isLocked:  isAccountLocked(e.userAccountControl),
      isEnabled: isAccountEnabled(e.userAccountControl),
      lastLogin: parseADDate(e.lastLogon),
      dn:        e.dn,
    }));
  } catch (err) {
    console.warn('[LDAP] searchUsersInOU unreachable:', err.message);
    return null; // caller falls back to local DB
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Reset user password (requires LDAPS on port 636) ────────────────────────
exports.resetPassword = async (userDN, newPassword) => {
  let client;
  try {
    client = new Client({
      url: LDAPS_URL,
      timeout: 5000,
      tlsOptions: { rejectUnauthorized: false },
    });
    await client.bind(LDAP_BIND_DN, LDAP_PASSWORD);
    // AD requires UTF-16LE encoded password wrapped in double quotes
    const encoded = Buffer.from('"' + newPassword + '"', 'utf16le');
    await client.modify(userDN, [
      new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'unicodePwd', values: [encoded] }),
      }),
    ]);
    return { success: true };
  } catch (err) {
    console.error('[LDAP] resetPassword failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Lock or Unlock a user account ───────────────────────────────────────────
// lock=true → disable (514), lock=false → enable (512)
exports.setAccountLock = async (userDN, lock = true) => {
  let client;
  try {
    client = await getClient();
    const uac = lock ? '514' : '512';
    await client.modify(userDN, [
      new Change({
        operation: 'replace',
        modification: new Attribute({ type: 'userAccountControl', values: [uac] }),
      }),
    ]);
    return { success: true };
  } catch (err) {
    console.error('[LDAP] setAccountLock failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Create a new user in AD OU ───────────────────────────────────────────────
exports.createADUser = async (ouDN, { adLogin, fullName, password, position, email }) => {
  let client;
  try {
    client = await getClient();
    const userDN = 'CN=' + fullName + ',' + ouDN;
    const encodedPwd = Buffer.from('"' + (password || 'Netguard@2026') + '"', 'utf16le');
    await client.add(userDN, {
      objectClass:        ['top', 'person', 'organizationalPerson', 'user'],
      cn:                 fullName,
      sAMAccountName:     adLogin,
      userPrincipalName:  adLogin + '@uztmk.local',
      displayName:        fullName,
      mail:               email || adLogin + '@uztmk.local',
      title:              position || '',
      unicodePwd:         encodedPwd,
      userAccountControl: '512',
    });
    return { success: true, dn: userDN };
  } catch (err) {
    console.error('[LDAP] createADUser failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Delete a user from AD ────────────────────────────────────────────────────
exports.deleteADUser = async (userDN) => {
  let client;
  try {
    client = await getClient();
    await client.del(userDN);
    return { success: true };
  } catch (err) {
    console.error('[LDAP] deleteADUser failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Move user to another OU ──────────────────────────────────────────────────
exports.moveUser = async (userDN, targetOUDN, fullName) => {
  let client;
  try {
    client = await getClient();
    await client.modifyDN(userDN, 'CN=' + fullName, true, targetOUDN);
    return { success: true };
  } catch (err) {
    console.error('[LDAP] moveUser failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Update user attributes (name, position, email) ──────────────────────────
exports.updateADUser = async (userDN, updates) => {
  let client;
  try {
    client = await getClient();
    const changes = [];
    if (updates.position) {
      changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'title', values: [updates.position] }) }));
    }
    if (updates.email) {
      changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'mail', values: [updates.email] }) }));
    }
    if (updates.phone) {
      changes.push(new Change({ operation: 'replace', modification: new Attribute({ type: 'telephoneNumber', values: [updates.phone] }) }));
    }
    if (changes.length > 0) await client.modify(userDN, changes);
    return { success: true };
  } catch (err) {
    console.error('[LDAP] updateADUser failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    if (client) await client.unbind().catch(() => {});
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function isAccountLocked(uac) {
  if (!uac) return false;
  return !!(parseInt(uac) & 16); // ADS_UF_LOCKOUT = 0x0010
}

function isAccountEnabled(uac) {
  if (!uac) return true;
  return !(parseInt(uac) & 2); // ADS_UF_ACCOUNTDISABLE = 0x0002
}

function parseADDate(adTimestamp) {
  if (!adTimestamp || adTimestamp === '0' || adTimestamp === '9223372036854775807') return null;
  try {
    const epoch = BigInt(adTimestamp) / 10000n - 11644473600000n;
    return epoch > 0n ? new Date(Number(epoch)) : null;
  } catch {
    return null;
  }
}
