import { PageSkeleton } from '@/components/ui/page-skeleton';

export default function RootLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-16">
      <PageSkeleton variant="analytics" />
    </div>
  );
}
