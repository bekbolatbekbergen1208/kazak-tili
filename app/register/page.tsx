import AuthForm from "@/components/learning/auth-form";

export const metadata = { title: "Регистрация · QazaqDos" };

export default function RegisterPage() {
  return <AuthForm initialMode="register" />;
}
