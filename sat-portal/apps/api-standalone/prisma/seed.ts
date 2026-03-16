import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Section = "math" | "reading_writing";
type Difficulty = "easy" | "medium" | "hard";

interface QuestionSeed {
  section: Section;
  difficulty: Difficulty;
  prompt: string;
  explanation: string;
  choices: { label: string; text: string; correct?: true }[];
}

const questions: QuestionSeed[] = [
  // ── MATH · EASY ────────────────────────────────────────────────────────────
  {
    section: "math", difficulty: "easy",
    prompt: "If x + 7 = 15, what is the value of x?",
    explanation: "Subtract 7 from both sides: x = 15 − 7 = 8.",
    choices: [
      { label: "A", text: "6" },
      { label: "B", text: "7" },
      { label: "C", text: "8", correct: true },
      { label: "D", text: "9" },
    ],
  },
  {
    section: "math", difficulty: "easy",
    prompt: "What is 15% of 200?",
    explanation: "15% of 200 = 0.15 × 200 = 30.",
    choices: [
      { label: "A", text: "20" },
      { label: "B", text: "25" },
      { label: "C", text: "30", correct: true },
      { label: "D", text: "35" },
    ],
  },
  {
    section: "math", difficulty: "easy",
    prompt: "A rectangle has a length of 10 and a width of 4. What is its area?",
    explanation: "Area = length × width = 10 × 4 = 40.",
    choices: [
      { label: "A", text: "28" },
      { label: "B", text: "36" },
      { label: "C", text: "40", correct: true },
      { label: "D", text: "44" },
    ],
  },
  {
    section: "math", difficulty: "easy",
    prompt: "Which of the following is equivalent to 3²?",
    explanation: "3² = 3 × 3 = 9.",
    choices: [
      { label: "A", text: "6" },
      { label: "B", text: "8" },
      { label: "C", text: "9", correct: true },
      { label: "D", text: "12" },
    ],
  },

  // ── MATH · MEDIUM ──────────────────────────────────────────────────────────
  {
    section: "math", difficulty: "medium",
    prompt: "The equation y = 2x + 3 is graphed in the xy-plane. What is the y-intercept?",
    explanation: "The y-intercept is the constant term when the equation is in slope-intercept form y = mx + b. Here b = 3.",
    choices: [
      { label: "A", text: "2" },
      { label: "B", text: "3", correct: true },
      { label: "C", text: "5" },
      { label: "D", text: "−3" },
    ],
  },
  {
    section: "math", difficulty: "medium",
    prompt: "If f(x) = x² − 4x + 4, what is f(3)?",
    explanation: "f(3) = 9 − 12 + 4 = 1.",
    choices: [
      { label: "A", text: "0" },
      { label: "B", text: "1", correct: true },
      { label: "C", text: "3" },
      { label: "D", text: "4" },
    ],
  },
  {
    section: "math", difficulty: "medium",
    prompt: "A car travels 180 miles in 3 hours. At the same rate, how many miles will it travel in 5 hours?",
    explanation: "Rate = 180 ÷ 3 = 60 mph. Distance in 5 hours = 60 × 5 = 300 miles.",
    choices: [
      { label: "A", text: "240" },
      { label: "B", text: "270" },
      { label: "C", text: "300", correct: true },
      { label: "D", text: "360" },
    ],
  },
  {
    section: "math", difficulty: "medium",
    prompt: "What are the solutions to x² − 5x + 6 = 0?",
    explanation: "Factor: (x − 2)(x − 3) = 0, so x = 2 or x = 3.",
    choices: [
      { label: "A", text: "x = 1 and x = 6" },
      { label: "B", text: "x = 2 and x = 3", correct: true },
      { label: "C", text: "x = −2 and x = −3" },
      { label: "D", text: "x = 3 and x = 5" },
    ],
  },

  // ── MATH · HARD ────────────────────────────────────────────────────────────
  {
    section: "math", difficulty: "hard",
    prompt: "In the xy-plane, line l has a slope of −2/3 and passes through (6, 1). What is the x-intercept of line l?",
    explanation: "Using point-slope: y − 1 = −2/3(x − 6). Set y = 0: −1 = −2/3(x − 6) → x − 6 = 3/2 → x = 7.5.",
    choices: [
      { label: "A", text: "6" },
      { label: "B", text: "7" },
      { label: "C", text: "7.5", correct: true },
      { label: "D", text: "9" },
    ],
  },
  {
    section: "math", difficulty: "hard",
    prompt: "A system of equations is given: 3x + 2y = 12 and x − y = 1. What is the value of x + y?",
    explanation: "From x − y = 1, x = y + 1. Substitute: 3(y+1) + 2y = 12 → 5y = 9 → y = 9/5. x = 9/5 + 1 = 14/5. x + y = 23/5.",
    choices: [
      { label: "A", text: "3" },
      { label: "B", text: "4" },
      { label: "C", text: "23/5", correct: true },
      { label: "D", text: "5" },
    ],
  },

  // ── READING & WRITING · EASY ───────────────────────────────────────────────
  {
    section: "reading_writing", difficulty: "easy",
    prompt: "The scientist's findings were _______ by her peers, who praised the rigor of her methodology. Which word best completes the sentence?",
    explanation: "'Validated' means confirmed or substantiated, which fits the context of praise for rigorous methodology.",
    choices: [
      { label: "A", text: "ignored" },
      { label: "B", text: "validated", correct: true },
      { label: "C", text: "disputed" },
      { label: "D", text: "misrepresented" },
    ],
  },
  {
    section: "reading_writing", difficulty: "easy",
    prompt: "Which of the following correctly uses a comma?",
    explanation: "A comma is used before a coordinating conjunction (FANBOYS) joining two independent clauses.",
    choices: [
      { label: "A", text: "She studied hard, but, she still felt unprepared." },
      { label: "B", text: "She studied hard, but she still felt unprepared.", correct: true },
      { label: "C", text: "She studied hard but, she still felt unprepared." },
      { label: "D", text: "She studied hard but she still felt unprepared." },
    ],
  },
  {
    section: "reading_writing", difficulty: "easy",
    prompt: "The word 'benevolent' most nearly means:",
    explanation: "'Benevolent' derives from Latin meaning 'well-wishing' — it describes someone who is kind and generous.",
    choices: [
      { label: "A", text: "strict" },
      { label: "B", text: "cautious" },
      { label: "C", text: "kind and generous", correct: true },
      { label: "D", text: "indifferent" },
    ],
  },
  {
    section: "reading_writing", difficulty: "easy",
    prompt: "Which sentence uses the apostrophe correctly?",
    explanation: "Possessive singular nouns take 's. 'The student's notebook' correctly shows that the notebook belongs to one student.",
    choices: [
      { label: "A", text: "The students notebook was left on the desk." },
      { label: "B", text: "The student's notebook was left on the desk.", correct: true },
      { label: "C", text: "The students' notebook was left on the desk." },
      { label: "D", text: "The student's' notebook was left on the desk." },
    ],
  },

  // ── READING & WRITING · MEDIUM ────────────────────────────────────────────
  {
    section: "reading_writing", difficulty: "medium",
    prompt: "A student wants to add a sentence that transitions from a discussion of deforestation's causes to its effects. Which choice best accomplishes this goal?",
    explanation: "A transition sentence should bridge the two topics — acknowledging causes while introducing effects.",
    choices: [
      { label: "A", text: "Deforestation has been occurring for centuries in many regions." },
      { label: "B", text: "These causes, however, are only part of the story; the consequences of deforestation are equally significant.", correct: true },
      { label: "C", text: "Many governments have enacted policies to slow deforestation." },
      { label: "D", text: "Scientists continue to study the rate at which forests are lost each year." },
    ],
  },
  {
    section: "reading_writing", difficulty: "medium",
    prompt: "The author's tone in describing the committee's decision can best be described as:",
    explanation: "Context clues such as 'hasty,' 'ill-considered,' and 'predictable failure' signal a critical tone.",
    choices: [
      { label: "A", text: "celebratory" },
      { label: "B", text: "neutral" },
      { label: "C", text: "critical", correct: true },
      { label: "D", text: "nostalgic" },
    ],
  },
  {
    section: "reading_writing", difficulty: "medium",
    prompt: "Which choice most effectively combines the two sentences below? 'The report was thorough. It was also clearly written.'",
    explanation: "Using 'not only...but also' effectively combines two parallel positive attributes in a single concise sentence.",
    choices: [
      { label: "A", text: "The report was thorough and it was clearly written too." },
      { label: "B", text: "The report was not only thorough but also clearly written.", correct: true },
      { label: "C", text: "Being thorough, the report was also clearly written." },
      { label: "D", text: "The report, thorough, was clearly written." },
    ],
  },
  {
    section: "reading_writing", difficulty: "medium",
    prompt: "In the sentence 'The data suggests that renewable energy adoption is accelerating,' what role does the clause 'that renewable energy adoption is accelerating' play?",
    explanation: "The clause functions as a noun clause — it is the direct object of the verb 'suggests.'",
    choices: [
      { label: "A", text: "Adverbial clause modifying 'suggests'" },
      { label: "B", text: "Noun clause acting as the direct object of 'suggests'", correct: true },
      { label: "C", text: "Relative clause modifying 'data'" },
      { label: "D", text: "Independent clause joined by a coordinating conjunction" },
    ],
  },

  // ── READING & WRITING · HARD ──────────────────────────────────────────────
  {
    section: "reading_writing", difficulty: "hard",
    prompt: "A researcher claims that urban green spaces reduce stress in city residents. Which of the following, if true, would most directly weaken this claim?",
    explanation: "If people who visit green spaces already have lower stress levels, the green spaces may not be causing the reduction — this is a confounding variable that directly weakens the causal claim.",
    choices: [
      { label: "A", text: "City residents report higher stress than rural residents on average." },
      { label: "B", text: "Green spaces in cities are often located in wealthier neighborhoods." },
      { label: "C", text: "Studies show that individuals who visit green spaces tend to already have lower baseline stress levels.", correct: true },
      { label: "D", text: "Some city residents live more than a mile from the nearest green space." },
    ],
  },
  {
    section: "reading_writing", difficulty: "hard",
    prompt: "The passage states that the new policy 'addresses symptoms rather than causes.' Which of the following best captures the author's implied criticism?",
    explanation: "The phrase 'symptoms rather than causes' implies the policy is superficial — it treats surface-level issues without resolving the underlying problems that generate them.",
    choices: [
      { label: "A", text: "The policy is too expensive to implement effectively." },
      { label: "B", text: "The policy focuses on surface-level issues without resolving the underlying problems.", correct: true },
      { label: "C", text: "The policy was developed without input from affected communities." },
      { label: "D", text: "The policy duplicates existing regulations and is therefore redundant." },
    ],
  },
];

async function main() {
  console.log("Seeding database…");

  await prisma.sessionAnswer.deleteMany();
  await prisma.score.deleteMany();
  await prisma.testSession.deleteMany();
  await prisma.choice.deleteMany();
  await prisma.question.deleteMany();

  for (const q of questions) {
    const correctIndex = q.choices.findIndex(c => c.correct);

    // Create the question without correctChoiceId first, then update
    // (we don't know the choice UUID until after choices are created)
    const created = await prisma.question.create({
      data: {
        section: q.section,
        difficulty: q.difficulty,
        prompt: q.prompt,
        explanation: q.explanation,
        correctChoiceId: "placeholder", // updated below
        choices: {
          create: q.choices.map(c => ({
            label: c.label,
            // Append "(Correct)" to the correct answer for easy testing
            text: c.correct ? `${c.text} (Correct)` : c.text,
          })),
        },
      },
      include: { choices: true },
    });

    const correctChoice = created.choices[correctIndex];
    await prisma.question.update({
      where: { id: created.id },
      data: { correctChoiceId: correctChoice.id },
    });

    console.log(`  ✓ [${q.section}·${q.difficulty}] ${q.prompt.slice(0, 60)}…`);
  }

  console.log(`\nDone. Seeded ${questions.length} questions.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
