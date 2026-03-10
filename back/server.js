import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { LeetCode } from "leetcode-query";
import OpenAI from "openai";

dotenv.config();

const app = express();
const leetcode = new LeetCode();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

const quizCache = new Map();

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function randomizeOptions(options, correctType) {
    const correctOption = options.find(o => o.type === correctType);
    const wrongOptions = options.filter(o => o.type !== correctType);
    
    const shuffledWrong = shuffleArray(wrongOptions);
    const allShuffled = shuffleArray([correctOption, ...shuffledWrong]);
    
    const labels = ['A', 'B', 'C', 'D'];
    return allShuffled.map((opt, i) => ({
        ...opt,
        label: labels[i]
    }));
}

function getRandomProblem(problemList) {
    const index = Math.floor(Math.random() * problemList.length);
    return problemList[index];
}

async function generateQuizOptions(title, description, pythonCode) {
    const prompt = `Given this LeetCode problem:
Title: ${title}
Description: ${description.replace(/<[^>]*>/g, '').slice(0, 1000)}
Python starter code: ${pythonCode?.slice(0, 500) || 'No starter code'}

Generate 4 Python code solutions as multiple choice options for a quiz.
- Option A: Best/optimal solution (correct, efficient time/space complexity)
- Option B: Correct but suboptimal solution (works but has worse complexity)
- Option C: Wrong solution (has a bug or incorrect logic)
- Option D: Wrong solution (completely wrong approach or syntax issue)

Respond ONLY in valid JSON format with no other text:
{"options": [{"code": "python code here", "type": "best"}, {"code": "python code here", "type": "correct_bad"}, {"code": "python code here", "type": "wrong"}, {"code": "python code here", "type": "wrong"}], "correctType": "best"}

Make sure the code is valid Python and fits the problem.`;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            max_tokens: 4000
        });

        const result = JSON.parse(response.choices[0].message.content);
        return result;
    } catch (error) {
        console.error("OpenAI error:", error);
        throw new Error("Failed to generate quiz options");
    }
}

app.get("/random-problem", async (req, res) => {
    try {
        const difficulty = req.query.difficulty;

        const response = await leetcode.problems();
        const problemList = response.questions;

        let filtered = problemList;

        if (difficulty) {
            filtered = problemList.filter(
                p => p.difficulty.toLowerCase() === difficulty.toLowerCase()
            );
        }

        if (filtered.length === 0) {
            return res.status(404).json({ error: "No problems found" });
        }

        const randomProblem = getRandomProblem(filtered);

        const fullProblem = await leetcode.problem(randomProblem.titleSlug);

        const pythonSnippet = fullProblem.codeSnippets.find(
            s => s.langSlug === "python"
        );

        res.json({
            title: fullProblem.title,
            difficulty: fullProblem.difficulty,
            description: fullProblem.content,
            pythonCode: pythonSnippet ? pythonSnippet.code : null
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch problem" });
    }
});

app.get("/quiz-problem", async (req, res) => {
    try {
        const difficulty = req.query.difficulty;
        const cacheKey = difficulty || 'all';

        if (quizCache.has(cacheKey) && quizCache.get(cacheKey).length > 0) {
            const cached = quizCache.get(cacheKey);
            const problem = cached.splice(Math.floor(Math.random() * cached.length), 1)[0];
            if (cached.length === 0) quizCache.delete(cacheKey);
            return res.json(problem);
        }

        const response = await leetcode.problems({ limit: 100 });
        const problemList = response.questions;

        let filtered = problemList;

        if (difficulty) {
            filtered = problemList.filter(
                p => p.difficulty.toLowerCase() === difficulty.toLowerCase()
            );
        }

        if (filtered.length === 0) {
            return res.status(404).json({ error: "No problems found" });
        }

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const problemsToGenerate = shuffled.slice(0, 10);

        const quizProblems = await Promise.all(
            problemsToGenerate.map(async (p) => {
                try {
                    const fullProblem = await leetcode.problem(p.titleSlug);
                    const pythonSnippet = fullProblem.codeSnippets.find(s => s.langSlug === "python");
                    const quizData = await generateQuizOptions(fullProblem.title, fullProblem.content, pythonSnippet?.code);
                    
                    const options = randomizeOptions(quizData.options, quizData.correctType);

                    return {
                        title: fullProblem.title,
                        difficulty: fullProblem.difficulty,
                        description: fullProblem.content,
                        pythonCode: pythonSnippet ? pythonSnippet.code : null,
                        options: options,
                        correctType: quizData.correctType
                    };
                } catch (e) {
                    console.error(`Failed to generate quiz for ${p.titleSlug}:`, e.message);
                    return null;
                }
            })
        );

        const validProblems = quizProblems.filter(p => p !== null);
        
        if (validProblems.length === 0) {
            return res.status(500).json({ error: "Failed to generate any quiz problems" });
        }

        const problem = validProblems[Math.floor(Math.random() * validProblems.length)];
        const remaining = validProblems.slice(1);
        
        if (remaining.length > 0) {
            quizCache.set(cacheKey, remaining);
        }

        res.json(problem);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to generate quiz" });
    }
});

app.listen(process.env.PORT || 3000, async () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
    console.log(`Warming up quiz cache...`);
    
    try {
        const difficulties = ['', 'easy', 'medium', 'hard'];
        await Promise.all(difficulties.map(async (diff) => {
            const cacheKey = diff || 'all';
            const response = await leetcode.problems({ limit: 100 });
            const problemList = response.questions;
            
            let filtered = problemList;
            if (diff) {
                filtered = problemList.filter(p => p.difficulty.toLowerCase() === diff);
            }
            
            const shuffled = [...filtered].sort(() => Math.random() - 0.5);
            const problemsToGenerate = shuffled.slice(0, 10);
            
            const quizProblems = await Promise.all(
                problemsToGenerate.map(async (p) => {
                    try {
                        const fullProblem = await leetcode.problem(p.titleSlug);
                        const pythonSnippet = fullProblem.codeSnippets.find(s => s.langSlug === "python");
                        const quizData = await generateQuizOptions(fullProblem.title, fullProblem.content, pythonSnippet?.code);
                        
                        const options = randomizeOptions(quizData.options, quizData.correctType);
                        
                        return {
                            title: fullProblem.title,
                            difficulty: fullProblem.difficulty,
                            description: fullProblem.content,
                            pythonCode: pythonSnippet ? pythonSnippet.code : null,
                            options: options,
                            correctType: quizData.correctType
                        };
                    } catch (e) {
                        return null;
                    }
                })
            );
            
            const valid = quizProblems.filter(p => p !== null);
            if (valid.length > 0) {
                quizCache.set(cacheKey, valid);
            }
        }));
        console.log(`Quiz cache ready with ${difficulties.length} difficulty levels`);
    } catch (e) {
        console.error('Failed to warm up cache:', e.message);
    }
});
