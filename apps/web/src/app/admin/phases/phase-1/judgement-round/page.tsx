import JudgementRoundView from '@/app/admin/phases/(components)/JudgementRoundView';

export default function PhaseOneJudgementRoundPage() {
  return (
    <JudgementRoundView
      phaseId={1}
      title="Phase 1 Judgement Round"
      description="Review Phase 1 submissions, compile judge feedback, and confirm which participants advance to Phase 2."
    />
  );
}
