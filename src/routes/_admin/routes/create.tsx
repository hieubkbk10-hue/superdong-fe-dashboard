import { createFileRoute } from '@tanstack/react-router';
import { RouteForm } from '@/components/routes/RouteForm';

export const Route = createFileRoute('/_admin/routes/create')({
  component: RouteCreatePage,
});

function RouteCreatePage() {
  return <RouteForm mode="create" />;
}
