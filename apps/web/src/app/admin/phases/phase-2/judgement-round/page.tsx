import JudgementRoundView from '@/app/admin/phases/(components)/JudgementRoundView';

export default function PhaseTwoJudgementRoundPage() {
  return (
    <JudgementRoundView
      phaseId={2}
      title="Phase 2 Judgement Round"
      description="Evaluate Phase 2 performances, aggregate judge scores, and prepare finalists for the final phase."
    />
  );
}
