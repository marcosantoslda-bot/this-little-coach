import { Redirect } from 'expo-router';

/** Destino dos links de email; a sessão é criada em lib/auth-links.ts e a porta redireciona. */
export default function AuthCallback() {
  return <Redirect href="/" />;
}
