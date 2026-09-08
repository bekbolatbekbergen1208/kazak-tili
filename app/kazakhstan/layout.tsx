import { LearningProvider } from "@/components/learning/provider";
import { LearningFrame } from "@/components/learning/frame";
import "./travel.css";
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <LearningProvider>
      <LearningFrame>{children}</LearningFrame>
    </LearningProvider>
  );
}
