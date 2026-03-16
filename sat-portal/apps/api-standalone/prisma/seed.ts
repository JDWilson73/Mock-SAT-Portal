import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Section = "math" | "reading_writing";
type Difficulty = "easy" | "medium" | "hard";

// Math subtypes: algebra, geometry, probability, data_analysis
// R&W subtypes: comprehension, grammar, vocabulary, rhetoric

interface QuestionSeed {
  section: Section;
  subtype: string;
  difficulty: Difficulty;
  prompt: string;
  explanation: string;
  choices: { label: string; text: string; correct?: true }[];
}

const questions: QuestionSeed[] = [
  // ── MATH · ALGEBRA ─────────────────────────────────────────────────────────
  {
    section: "math", subtype: "algebra", difficulty: "easy",
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
    section: "math", subtype: "algebra", difficulty: "medium",
    prompt: "The equation y = 2x + 3 is graphed in the xy-plane. What is the y-intercept?",
    explanation: "In slope-intercept form y = mx + b, the y-intercept is b = 3.",
    choices: [
      { label: "A", text: "2" },
      { label: "B", text: "3", correct: true },
      { label: "C", text: "5" },
      { label: "D", text: "−3" },
    ],
  },
  {
    section: "math", subtype: "algebra", difficulty: "medium",
    prompt: "What are the solutions to x² − 5x + 6 = 0?",
    explanation: "Factor: (x − 2)(x − 3) = 0, so x = 2 or x = 3.",
    choices: [
      { label: "A", text: "x = 1 and x = 6" },
      { label: "B", text: "x = 2 and x = 3", correct: true },
      { label: "C", text: "x = −2 and x = −3" },
      { label: "D", text: "x = 3 and x = 5" },
    ],
  },
  {
    section: "math", subtype: "algebra", difficulty: "hard",
    prompt: "A system of equations: 3x + 2y = 12 and x − y = 1. What is the value of x + y?",
    explanation: "From x − y = 1, x = y + 1. Substituting: 5y = 9, y = 9/5, x = 14/5. x + y = 23/5.",
    choices: [
      { label: "A", text: "3" },
      { label: "B", text: "4" },
      { label: "C", text: "23/5", correct: true },
      { label: "D", text: "5" },
    ],
  },

  // ── MATH · GEOMETRY ────────────────────────────────────────────────────────
  {
    section: "math", subtype: "geometry", difficulty: "easy",
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
    section: "math", subtype: "geometry", difficulty: "medium",
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
    section: "math", subtype: "geometry", difficulty: "hard",
    prompt: "Line l has slope −2/3 and passes through (6, 1). What is the x-intercept?",
    explanation: "y − 1 = −2/3(x − 6). Set y = 0: x = 7.5.",
    choices: [
      { label: "A", text: "6" },
      { label: "B", text: "7" },
      { label: "C", text: "7.5", correct: true },
      { label: "D", text: "9" },
    ],
  },

  // ── MATH · PROBABILITY ─────────────────────────────────────────────────────
  {
    section: "math", subtype: "probability", difficulty: "easy",
    prompt: "A bag contains 3 red marbles and 7 blue marbles. What is the probability of picking a red marble?",
    explanation: "P(red) = 3/10 = 0.3.",
    choices: [
      { label: "A", text: "0.2" },
      { label: "B", text: "0.3", correct: true },
      { label: "C", text: "0.5" },
      { label: "D", text: "0.7" },
    ],
  },
  {
    section: "math", subtype: "probability", difficulty: "medium",
    prompt: "A fair six-sided die is rolled twice. What is the probability of rolling a 6 both times?",
    explanation: "P(6) × P(6) = 1/6 × 1/6 = 1/36.",
    choices: [
      { label: "A", text: "1/6" },
      { label: "B", text: "1/12" },
      { label: "C", text: "1/36", correct: true },
      { label: "D", text: "1/3" },
    ],
  },

  // ── MATH · DATA ANALYSIS ───────────────────────────────────────────────────
  {
    section: "math", subtype: "data_analysis", difficulty: "easy",
    prompt: "What is 15% of 200?",
    explanation: "0.15 × 200 = 30.",
    choices: [
      { label: "A", text: "20" },
      { label: "B", text: "25" },
      { label: "C", text: "30", correct: true },
      { label: "D", text: "35" },
    ],
  },
  {
    section: "math", subtype: "data_analysis", difficulty: "medium",
    prompt: "A car travels 180 miles in 3 hours. At the same rate, how many miles in 5 hours?",
    explanation: "Rate = 60 mph. Distance = 60 × 5 = 300.",
    choices: [
      { label: "A", text: "240" },
      { label: "B", text: "270" },
      { label: "C", text: "300", correct: true },
      { label: "D", text: "360" },
    ],
  },

  // ── READING & WRITING · COMPREHENSION ─────────────────────────────────────
  {
    section: "reading_writing", subtype: "comprehension", difficulty: "easy",
    prompt: "The author argues that standardized testing provides a consistent metric for comparison. Which choice best supports this claim?",
    explanation: "A shared scoring scale directly supports the claim about consistent comparison across different school systems.",
    choices: [
      { label: "A", text: "Testing creates uniform expectations schools must meet." },
      { label: "B", text: "A shared scoring scale lets colleges evaluate students from different systems equally.", correct: true },
      { label: "C", text: "High scores correlate with first-year college success." },
      { label: "D", text: "Many students improve scores with targeted prep." },
    ],
  },
  {
    section: "reading_writing", subtype: "comprehension", difficulty: "medium",
    prompt: "A student wants to add a sentence transitioning from causes to effects of deforestation. Which best accomplishes this?",
    explanation: "A transition sentence must acknowledge causes while introducing effects — only option B does both.",
    choices: [
      { label: "A", text: "Deforestation has been occurring for centuries in many regions." },
      { label: "B", text: "These causes are only part of the story; the consequences are equally significant.", correct: true },
      { label: "C", text: "Many governments have enacted policies to slow deforestation." },
      { label: "D", text: "Scientists continue to study the rate at which forests are lost." },
    ],
  },
  {
    section: "reading_writing", subtype: "comprehension", difficulty: "hard",
    prompt: "The passage states the policy 'addresses symptoms rather than causes.' Which best captures the implied criticism?",
    explanation: "'Symptoms rather than causes' implies superficiality — treating surface issues without resolving underlying problems.",
    choices: [
      { label: "A", text: "The policy is too expensive to implement effectively." },
      { label: "B", text: "The policy focuses on surface issues without resolving underlying problems.", correct: true },
      { label: "C", text: "The policy was developed without community input." },
      { label: "D", text: "The policy duplicates existing regulations and is redundant." },
    ],
  },

  // ── READING & WRITING · GRAMMAR ────────────────────────────────────────────
  {
    section: "reading_writing", subtype: "grammar", difficulty: "easy",
    prompt: "Which of the following correctly uses a comma?",
    explanation: "A comma goes before a coordinating conjunction joining two independent clauses.",
    choices: [
      { label: "A", text: "She studied hard, but, she still felt unprepared." },
      { label: "B", text: "She studied hard, but she still felt unprepared.", correct: true },
      { label: "C", text: "She studied hard but, she still felt unprepared." },
      { label: "D", text: "She studied hard but she still felt unprepared." },
    ],
  },
  {
    section: "reading_writing", subtype: "grammar", difficulty: "easy",
    prompt: "Which sentence uses the apostrophe correctly?",
    explanation: "Possessive singular nouns take 's. One student owns the notebook.",
    choices: [
      { label: "A", text: "The students notebook was left on the desk." },
      { label: "B", text: "The student's notebook was left on the desk.", correct: true },
      { label: "C", text: "The students' notebook was left on the desk." },
      { label: "D", text: "The student's' notebook was left on the desk." },
    ],
  },
  {
    section: "reading_writing", subtype: "grammar", difficulty: "medium",
    prompt: "Which choice most effectively combines the sentences: 'The report was thorough. It was also clearly written.'",
    explanation: "'Not only...but also' combines two parallel attributes concisely.",
    choices: [
      { label: "A", text: "The report was thorough and it was clearly written too." },
      { label: "B", text: "The report was not only thorough but also clearly written.", correct: true },
      { label: "C", text: "Being thorough, the report was also clearly written." },
      { label: "D", text: "The report, thorough, was clearly written." },
    ],
  },

  // ── READING & WRITING · VOCABULARY ────────────────────────────────────────
  {
    section: "reading_writing", subtype: "vocabulary", difficulty: "easy",
    prompt: "The scientist's findings were _______ by her peers, who praised the rigor of her methodology.",
    explanation: "'Validated' means confirmed or substantiated — fitting praise for rigorous methodology.",
    choices: [
      { label: "A", text: "ignored" },
      { label: "B", text: "validated", correct: true },
      { label: "C", text: "disputed" },
      { label: "D", text: "misrepresented" },
    ],
  },
  {
    section: "reading_writing", subtype: "vocabulary", difficulty: "easy",
    prompt: "The word 'benevolent' most nearly means:",
    explanation: "'Benevolent' derives from Latin 'well-wishing' — kind and generous.",
    choices: [
      { label: "A", text: "strict" },
      { label: "B", text: "cautious" },
      { label: "C", text: "kind and generous", correct: true },
      { label: "D", text: "indifferent" },
    ],
  },

  // ── READING & WRITING · RHETORIC ──────────────────────────────────────────
  {
    section: "reading_writing", subtype: "rhetoric", difficulty: "medium",
    prompt: "The author's tone in describing the committee's decision can best be described as:",
    explanation: "Words like 'hasty,' 'ill-considered,' and 'predictable failure' signal a critical tone.",
    choices: [
      { label: "A", text: "celebratory" },
      { label: "B", text: "neutral" },
      { label: "C", text: "critical", correct: true },
      { label: "D", text: "nostalgic" },
    ],
  },
  {
    section: "reading_writing", subtype: "rhetoric", difficulty: "hard",
    prompt: "A researcher claims urban green spaces reduce stress. Which, if true, most directly weakens this claim?",
    explanation: "If visitors already have lower baseline stress, the green space may not be causing the reduction — a confounding variable.",
    choices: [
      { label: "A", text: "City residents report higher stress than rural residents." },
      { label: "B", text: "Green spaces are often in wealthier neighborhoods." },
      { label: "C", text: "Individuals who visit green spaces tend to already have lower baseline stress levels.", correct: true },
      { label: "D", text: "Some residents live more than a mile from the nearest green space." },
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
    const created = await prisma.question.create({
      data: {
        section: q.section,
        subtype: q.subtype,
        difficulty: q.difficulty,
        prompt: q.prompt,
        explanation: q.explanation,
        correctChoiceId: "placeholder",
        choices: {
          create: q.choices.map(c => ({
            label: c.label,
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
    console.log(`  ✓ [${q.section}·${q.subtype}·${q.difficulty}] ${q.prompt.slice(0, 55)}…`);
  }

  console.log(`\nDone. Seeded ${questions.length} questions.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
