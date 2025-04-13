import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const Consent = ({ onAgree }) => {
  const [consentChecked, setConsentChecked] = useState(false);

  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Zgoda na udział w badaniu</h1>
      <p className="mb-4">
        Klikając poniżej, wyrażasz zgodę na udział w badaniu. (Treść zgody będzie tutaj wklejona)
      </p>
      <div className="mb-4">
        <label className="inline-flex items-center">
          <input type="checkbox" className="mr-2" onChange={() => setConsentChecked(!consentChecked)} />
          Akceptuję warunki udziału w badaniu
        </label>
      </div>
      <Button onClick={onAgree} disabled={!consentChecked}>
        Wyrażam zgodę i przechodzę dalej
      </Button>
    </div>
  );
};

export default Consent;