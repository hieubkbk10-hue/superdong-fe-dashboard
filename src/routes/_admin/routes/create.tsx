import { createFileRoute } from '@tanstack/react-router';
import { RouteForm } from './-route-form';

export const Route = createFileRoute('/_admin/routes/create')({
  component: RouteCreatePage,
});

function RouteCreatePage() {
  return <RouteForm mode="create" />;
}
