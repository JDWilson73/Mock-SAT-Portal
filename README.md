# SAT Portal

Full-stack SAT practice portal — React + TypeScript frontend, Express + TypeScript backend, PostgreSQL via Prisma, deployed on Vercel.

## Monorepo structure

```
sat-portal/
├── apps/
│   ├── web/                     React + Vite + TypeScript
│   └── api-standalone/          Express + TypeScript + Prisma
├── packages/
│   └── shared/       Shared domain types (Question, TestSession, Score…)
└── vercel.json       Routes /api/* → Express, /* → SPA
```

## Stack considerations
**React:** Since it is relatively lightweight as a library rather than a full framework, it's a good choice for a small application like this.  
**Vite:** For fast development iteration with optimized hot module reloading and dependency pre-bundling  
**TypeScript:** For preventing type-based errors; transpilation helps catch bugs before they occur at compile-time  
**Express:** Simplified routing for the single-page application  
**Prisma:** Object-relational mapper that allows for simplified database workflows and intuitive schema definition for the database  
**PostGreSQL** via **Neon:** Being a free option with minimal setup woes, it's a perfect option for a small project; since PostGres handles heavy writes  
well, it's a good choice for an application that is going to be logging answer and score data for an entire exam's worth of questions at once.  
**Vercel:** A free option for hosting with a variety of features, including load balancing (just in case a project like this scales upward).  

## Architectural notes
- api/index.ts is fully self-contained, as that's the format expected by Vercel, so this is to aid in the simplicity and maintainability of the application.
- API is a separate deployment to the UI in Vercel to keep changes affecting only the relevant parts and ease in working with the platform.  API also has a health check.
- Vercel provides serverless functionality for the API, making it flexible and scalable based on usage.
- The database schema contains information about question types, sub-types, given answers, etc., in order to give the most detailed feedback possible to the student in results reporting.
- CORS policy implemented for security and peace of mind of users.
- JWT access and refresh tokens are stored in localStorage for simplicity.
- public/shared types provides a shared source of truth for both UI and API.
- Accessibility options are considered, such as keyboard navigation, screen-reader capabilities, and aria-label/controls/expanded on relevant elements.

## Trade-offs
- Usage of the public/shared directory causes some issues when building with Windows and deploying on Vercel--some friction was caused because of needing to render the dist/ directory during the build process, but the symlink that was used initially didn't render properly between environments.  Altogether it made some things more of a headache than they should've been.
- There are some quirks with the database schema design that make it such that changing question answers in-post would not dynamically change scores, as the score is stored in the database rather than being derived on read.  Additionally, the database is not capable of enforcing that a question necessarily has its correct answer be one of the answers given in the database--this is due to the schema not being normalized (i.e. each answer would be assigned a boolean of isCorrect).
- Storing JWT in localStorage (rather than using httpOnly cookies) means the application is vulnerable to XSS attacks, but due to the nature of the portal not using sensitive information, this is a minor consideration.
- Fetching and randomizing questions happens trivially fast in the frontend due to only having around 100 questions of both sections in the database, but for larger numbers of questions in the database, this randomization would likely need to be moved into the database itself for performance reasons.
- The timer is done entirely client-side in the practice portal, meaning that it could be manipulated; however, as it's a practice portal and not the real test, this has low stakes.
- Environment variables are duplicated, given the split nature of the project deployment. Changing them in one place would require changing them in the other (such as JWT secret).

## Additional notes on usage
- The timer can be hidden to prevent distraction.
- Questions can be flagged for easy distinction when revisiting.
- Radial bar chart available to show question sub-type correct rate on results page.
- Results page shows explanation in addition to correct and selected answers.
- Can add extra time to simulate accessibility accommodations.
- Different lengths of tests available to fit into students' busy schedules and attention spans (they can work up to a full-length test).
- Background is a cool blue gradient that shifts over time to calm the user and remind them to breathe.
## Considerations for future iterations
- I would probably have it such that questions won't reappear until a certain amount of time has passed (e.g. 7 days), but that seemed a bit out of scope of this assignment.
- It might be a good idea to make a separate UI folder and set the Vercel deployment to track that folder, such that changes to the API don't trigger a redeployment of the UI.
- Moving the timer to server-side could be a good use of time if scores could end up being shared with others, say, in a leaderboard of sorts (to prevent cheating by increasing time).
- Email verification and password reset flows would be necessary in production environments.
- A means to add questions without having to manually seed the database (e.g. through an admin portal).
- Further accessibility improvements, such as a high-contrast mode for colorblind users.

