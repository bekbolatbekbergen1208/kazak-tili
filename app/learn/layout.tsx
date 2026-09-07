import { LearningProvider } from "@/components/learning/provider";
import { LearningFrame } from "@/components/learning/frame";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LearningProvider>
      <LearningFrame>{children}</LearningFrame>
    </LearningProvider>
  );
}
