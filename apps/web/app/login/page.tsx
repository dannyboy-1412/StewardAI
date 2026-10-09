import { AuthForm } from '@/features/auth/AuthForm'
import { safeNextPath } from '@/lib/auth-redirect'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const params = await searchParams
  return (
    <AuthForm mode="login" nextPath={safeNextPath(params.next)} error={params.error} />
  )
}
