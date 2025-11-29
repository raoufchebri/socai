export type QuestionType = 'single' | 'multiple' | 'text' | 'scale';

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  description?: string;
  options?: QuestionOption[];
  required?: boolean;
  maxSelections?: number; // for multiple choice
  scaleMin?: number; // for scale type
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

export interface SurveySection {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export const surveyQuestions: SurveySection[] = [
  {
    id: 'demographics',
    title: 'About You',
    description: 'Let\'s start with some background information',
    questions: [
      {
        id: 'role',
        type: 'single',
        prompt: 'What best describes your current role?',
        options: [
          { id: 'frontend', label: 'Frontend Developer', value: 'frontend' },
          { id: 'backend', label: 'Backend Developer', value: 'backend' },
          { id: 'fullstack', label: 'Full Stack Developer', value: 'fullstack' },
          { id: 'devops', label: 'DevOps / SRE', value: 'devops' },
          { id: 'mobile', label: 'Mobile Developer', value: 'mobile' },
          { id: 'data', label: 'Data Scientist / ML Engineer', value: 'data' },
          { id: 'student', label: 'Student', value: 'student' },
          { id: 'hobbyist', label: 'Hobbyist', value: 'hobbyist' },
          { id: 'other', label: 'Other', value: 'other' },
        ],
      },
      {
        id: 'experience',
        type: 'single',
        prompt: 'How many years have you been coding?',
        options: [
          { id: 'less1', label: 'Less than 1 year', value: '<1' },
          { id: '1to3', label: '1-3 years', value: '1-3' },
          { id: '3to5', label: '3-5 years', value: '3-5' },
          { id: '5to10', label: '5-10 years', value: '5-10' },
          { id: '10plus', label: '10+ years', value: '10+' },
        ],
      },
      {
        id: 'company_size',
        type: 'single',
        prompt: 'What is the size of your company/organization?',
        options: [
          { id: 'solo', label: 'Solo / Freelance', value: 'solo' },
          { id: 'small', label: '2-10 employees', value: '2-10' },
          { id: 'medium', label: '11-50 employees', value: '11-50' },
          { id: 'large', label: '51-200 employees', value: '51-200' },
          { id: 'enterprise', label: '200+ employees', value: '200+' },
          { id: 'student', label: 'Student / Not applicable', value: 'na' },
        ],
      },
    ],
  },
  {
    id: 'ai_tools',
    title: 'AI Coding Tools',
    description: 'Tell us about the AI tools you use',
    questions: [
      {
        id: 'ai_tools_used',
        type: 'multiple',
        prompt: 'Which AI coding tools have you used?',
        description: 'Select all that apply',
        options: [
          { id: 'copilot', label: 'GitHub Copilot', value: 'copilot' },
          { id: 'cursor', label: 'Cursor', value: 'cursor' },
          { id: 'codewhisperer', label: 'Amazon CodeWhisperer', value: 'codewhisperer' },
          { id: 'tabnine', label: 'Tabnine', value: 'tabnine' },
          { id: 'cody', label: 'Sourcegraph Cody', value: 'cody' },
          { id: 'chatgpt', label: 'ChatGPT', value: 'chatgpt' },
          { id: 'claude', label: 'Claude', value: 'claude' },
          { id: 'gemini', label: 'Google Gemini', value: 'gemini' },
          { id: 'windsurf', label: 'Windsurf', value: 'windsurf' },
          { id: 'replit', label: 'Replit AI', value: 'replit' },
          { id: 'none', label: 'None', value: 'none' },
        ],
      },
      {
        id: 'primary_tool',
        type: 'single',
        prompt: 'Which is your PRIMARY AI coding tool?',
        options: [
          { id: 'copilot', label: 'GitHub Copilot', value: 'copilot' },
          { id: 'cursor', label: 'Cursor', value: 'cursor' },
          { id: 'codewhisperer', label: 'Amazon CodeWhisperer', value: 'codewhisperer' },
          { id: 'tabnine', label: 'Tabnine', value: 'tabnine' },
          { id: 'cody', label: 'Sourcegraph Cody', value: 'cody' },
          { id: 'chatgpt', label: 'ChatGPT', value: 'chatgpt' },
          { id: 'claude', label: 'Claude', value: 'claude' },
          { id: 'gemini', label: 'Google Gemini', value: 'gemini' },
          { id: 'windsurf', label: 'Windsurf', value: 'windsurf' },
          { id: 'replit', label: 'Replit AI', value: 'replit' },
          { id: 'none', label: 'I don\'t use AI tools', value: 'none' },
        ],
      },
      {
        id: 'usage_frequency',
        type: 'single',
        prompt: 'How often do you use AI coding tools?',
        options: [
          { id: 'constantly', label: 'Constantly (multiple times per hour)', value: 'constantly' },
          { id: 'frequently', label: 'Frequently (several times per day)', value: 'frequently' },
          { id: 'occasionally', label: 'Occasionally (a few times per week)', value: 'occasionally' },
          { id: 'rarely', label: 'Rarely (a few times per month)', value: 'rarely' },
          { id: 'never', label: 'Never', value: 'never' },
        ],
      },
    ],
  },
  {
    id: 'workflow',
    title: 'Workflow & Impact',
    description: 'How AI tools affect your coding workflow',
    questions: [
      {
        id: 'tasks',
        type: 'multiple',
        prompt: 'What tasks do you use AI coding tools for?',
        description: 'Select all that apply',
        options: [
          { id: 'autocomplete', label: 'Code autocomplete', value: 'autocomplete' },
          { id: 'generate', label: 'Generating new code', value: 'generate' },
          { id: 'refactor', label: 'Refactoring existing code', value: 'refactor' },
          { id: 'debug', label: 'Debugging', value: 'debug' },
          { id: 'tests', label: 'Writing tests', value: 'tests' },
          { id: 'docs', label: 'Writing documentation', value: 'docs' },
          { id: 'explain', label: 'Explaining code', value: 'explain' },
          { id: 'review', label: 'Code review', value: 'review' },
          { id: 'learn', label: 'Learning new technologies', value: 'learn' },
        ],
      },
      {
        id: 'productivity_impact',
        type: 'scale',
        prompt: 'How much has AI improved your productivity?',
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'No improvement', max: 'Significantly improved' },
      },
      {
        id: 'code_quality',
        type: 'single',
        prompt: 'How has AI affected your code quality?',
        options: [
          { id: 'better', label: 'Code quality has improved', value: 'better' },
          { id: 'same', label: 'Code quality stayed the same', value: 'same' },
          { id: 'worse', label: 'Code quality has decreased', value: 'worse' },
          { id: 'mixed', label: 'Mixed results', value: 'mixed' },
        ],
      },
    ],
  },
  {
    id: 'concerns',
    title: 'Concerns & Future',
    description: 'Your thoughts on AI in coding',
    questions: [
      {
        id: 'concerns',
        type: 'multiple',
        prompt: 'What concerns do you have about AI coding tools?',
        description: 'Select all that apply',
        options: [
          { id: 'security', label: 'Security vulnerabilities in generated code', value: 'security' },
          { id: 'privacy', label: 'Code privacy / data leakage', value: 'privacy' },
          { id: 'accuracy', label: 'Accuracy of generated code', value: 'accuracy' },
          { id: 'dependency', label: 'Over-reliance on AI', value: 'dependency' },
          { id: 'skills', label: 'Degradation of coding skills', value: 'skills' },
          { id: 'jobs', label: 'Job displacement', value: 'jobs' },
          { id: 'copyright', label: 'Copyright / licensing issues', value: 'copyright' },
          { id: 'cost', label: 'Cost of tools', value: 'cost' },
          { id: 'none', label: 'No concerns', value: 'none' },
        ],
      },
      {
        id: 'future_role',
        type: 'single',
        prompt: 'In 5 years, how do you see AI affecting development?',
        options: [
          { id: 'essential', label: 'AI will be essential for all developers', value: 'essential' },
          { id: 'common', label: 'AI will be commonly used but optional', value: 'common' },
          { id: 'niche', label: 'AI will remain a niche tool', value: 'niche' },
          { id: 'decline', label: 'AI hype will decline', value: 'decline' },
          { id: 'replace', label: 'AI will replace most coding tasks', value: 'replace' },
        ],
      },
      {
        id: 'recommendation',
        type: 'scale',
        prompt: 'Would you recommend AI coding tools to other developers?',
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Not at all', max: 'Absolutely' },
      },
    ],
  },
];

export const getTotalQuestions = (): number => {
  return surveyQuestions.reduce((total, section) => total + section.questions.length, 0);
};

export const getSectionByIndex = (index: number): SurveySection | undefined => {
  return surveyQuestions[index];
};

