const CORPORATE_URL = 'https://corporate.digitalbroker.in';

/**
 * Corporate site lives on a subdomain. This page keeps the URL as /corporate
 * and embeds that site so localhost:3000/corporate (and digitalbroker.in/corporate) work.
 */
export function CorporateRedirectPage() {
  return (
    <div className="fixed inset-0 z-[60] bg-black">
      <iframe
        title="DigitalBroker Corporate"
        src={CORPORATE_URL}
        className="w-full h-full border-0"
        allow="fullscreen"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
