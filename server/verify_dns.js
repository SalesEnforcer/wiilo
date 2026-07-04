const dns = require('dns');

const queryTXT = (domain) => {
  return new Promise((resolve) => {
    dns.resolveTxt(domain, (err, records) => {
      if (err) {
        resolve(null);
      } else {
        resolve(records.flatMap(r => r.join(' ')));
      }
    });
  });
};

const runDnsAudit = async () => {
  const domain = "salesenforcer.com.ng";
  console.log(`=== DNS DELIVERABILITY AUDIT FOR: ${domain} ===\n`);

  // 1. Audit SPF
  console.log('--- 1. AUDITING SPF RECORD ---');
  const txtRecords = await queryTXT(domain);
  if (txtRecords) {
    const spf = txtRecords.find(r => r.startsWith('v=spf1'));
    if (spf) {
      console.log(`[PASS] SPF Record found: "${spf}"`);
    } else {
      console.log('[FAIL] No SPF record found on domain! Gmail will mark this as spam.');
    }
  } else {
    console.log('[FAIL] No TXT records found on domain.');
  }

  // 2. Audit DMARC (Google & Yahoo strict requirement)
  console.log('\n=== 2. AUDITING DMARC RECORD ===');
  const dmarcDomain = `_dmarc.${domain}`;
  try {
    const dmarcRecords = await dns.promises.resolveTxt(dmarcDomain);
    const dmarc = dmarcRecords.flatMap(r => r.join(' ')).find(r => r.startsWith('v=DMARC1'));
    if (dmarc) {
      console.log(`[PASS] DMARC Record found: "${dmarc}"`);
    } else {
      console.log('[FAIL] No DMARC record found! Google will block or spam emails without this.');
    }
  } catch (err) {
    console.log(`[FAIL] No DMARC record found on ${dmarcDomain}! (Error: ${err.message})`);
  }

  console.log('\n===========================================');
  console.log('GUIDE TO INBOX DELIVERY:');
  console.log('Please log into your domain manager (GoDaddy, Namecheap, etc.) and ensure you have added:');
  console.log('1. SPF: TXT record with host "@" and value including: "include:amazonses.com include:mail-relay.brevo.com"');
  console.log('2. DMARC: TXT record with host "_dmarc" and value: "v=DMARC1; p=none; rua=mailto:dmarc-reports@salesenforcer.com.ng"');
  console.log('3. DKIM: CNAME/TXT records provided by your Brevo Senders & IP panel.');
};

runDnsAudit();
