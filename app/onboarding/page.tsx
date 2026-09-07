import { LearningProvider } from "@/components/learning/provider";
import { ProfileForm } from "@/components/learning/profile-form";
export default function Page() {
  return (
    <LearningProvider>
      <ProfileForm onboarding />
    </LearningProvider>
  );
}
