import React from 'react';
import { Button } from '@/components/ui/button';

const PreStudyInfo = ({ onNext }) => {
  return (
    <div className="p-6 max-w-2xl mx-auto text-center">
      <h1 className="text-2xl font-bold mb-4">Informacje o badaniu</h1>
      <p className="mb-6">
        Tutaj pojawi się treść informacyjna dotycząca badania. Można ją uzupełnić o dowolne szczegóły
        dotyczące celu, przebiegu, czasu trwania itd.
      </p>
      <Button onClick={onNext}>Dalej</Button>
    </div>
  );
};

export default PreStudyInfo;