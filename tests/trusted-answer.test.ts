import test from "node:test";
import assert from "node:assert/strict";
import { trustedTeachingAnswer, preferTrustedAnswer } from "../lib/friend/trusted-answer";
import { finalAssistantAnswer } from "../lib/friend/chat";

test("known correction is served without letting model fabricate its explanation", async () => {
  const answer = trustedTeachingAnswer("Мен бүгін хат жазды. Сөйлемді түзетіп, себебін түсіндір.");
  assert.match(answer!, /Мен бүгін хат жаздым/);
  assert.match(answer!, /жіктік жалғауы/);
  const reply = await preferTrustedAnswer(answer, async () => { throw Error("must not call model"); });
  assert.equal(reply, answer);
});
test("both literary authors are distinguished without rewriting source facts", () => {
  assert.match(trustedTeachingAnswer("Абайдың қара сөздері мен Абай жолы романының авторларын ата.")!, /Абай Құнанбайұлы[\s\S]*Мұхтар Әуезов/);
});
test("unknown contexts and quote requests are not replaced by a memorized correction", async () => {
  assert.equal(trustedTeachingAnswer("Әңгімеде: Мен бүгін хат жазды деп ойладым. Талда."), null);
  assert.equal(trustedTeachingAnswer("Мен бүгін хат жазды бірақ кеше хат жібердім."), null);
  assert.match(trustedTeachingAnswer("Абай жолы мен қара сөздер авторлары туралы дәйексөз ойлап тап")!, /дәл үзінді бере алмаймын/);
  assert.equal(await preferTrustedAnswer(null, async () => "candidate"), "candidate");
});
test("literary teacher corrects false author claims and refuses unsupported page quotes", async () => {
  const correction = trustedTeachingAnswer("Мен Мұхтар Әуезов Қара сөздерді жазған деп ойлаймын. Бұл дұрыс па?");
  assert.match(correction!, /Абай Құнанбайұлы/);
  assert.doesNotMatch(correction!, /Иә, дұрыс/);
  assert.match(trustedTeachingAnswer("Жусан иісінің 321-бетінен дәл сөйлем келтір")!, /дәл үзінді бере алмаймын/);
  assert.match(trustedTeachingAnswer("Абайдың 31-қара сөзінде есте сақтау туралы не айтылған?")!, /мазмұндама[\s\S]*abai.institute/);
  assert.match(trustedTeachingAnswer("Махаббат, қызық мол жылдар авторы кім?")!, /Әзілхан Нұршайықов/);
  assert.equal(await preferTrustedAnswer(correction, async () => "Мұхтар Әуезов жазған"), correction);
});
test("local reasoning is not displayed as a teacher answer", () => {
  assert.equal(finalAssistantAnswer("<think>hidden</think>\nСәлем!"), "Сәлем!");
  assert.equal(finalAssistantAnswer("reasoning with missing opening tag</think>\nЖауап."), "Жауап.");
  assert.throws(() => finalAssistantAnswer("<think>unfinished"), /AI_INCOMPLETE_ANSWER/);
  assert.throws(() => finalAssistantAnswer("<think>hidden</think>"), /AI_INCOMPLETE_ANSWER/);
  assert.equal(finalAssistantAnswer("Қалайсың?"), "Қалайсың?");
});
