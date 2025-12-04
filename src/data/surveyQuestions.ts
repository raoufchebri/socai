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
        id: 'age',
        type: 'single',
        prompt: 'How old are you?',
        description: 'Your age in years',
        options: [
          { id: 'under18', label: 'Under 18', value: 'under18' },
          { id: '18-24', label: '18-24 years old', value: '18-24' },
          { id: '25-34', label: '25-34 years old', value: '25-34' },
          { id: '35-44', label: '35-44 years old', value: '35-44' },
          { id: '45-54', label: '45-54 years old', value: '45-54' },
          { id: '55-64', label: '55-64 years old', value: '55-64' },
          { id: '65plus', label: '65 or older', value: '65+' },
          { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
        ],
      },
      {
        id: 'experience',
        type: 'single',
        prompt: 'How many years of experience do you have as a developer?',
        description: 'Whether as a professional, student, hobbyist, etc.',
        options: [
          { id: 'less1', label: 'Less than 1 year', value: '<1' },
          { id: '1to2', label: '1-2 years', value: '1-2' },
          { id: '3to5', label: '3-5 years', value: '3-5' },
          { id: '6to10', label: '6-10 years', value: '6-10' },
          { id: '11to20', label: '11-20 years', value: '11-20' },
          { id: '20plus', label: 'More than 20 years', value: '20+' },
        ],
      },
      {
        id: 'company_size',
        type: 'single',
        prompt: 'How many people work at your organization?',
        description: 'Including yourself',
        options: [
          { id: 'solo', label: 'Just me', value: 'solo' },
          { id: '2-5', label: '2-5 people', value: '2-5' },
          { id: '6-10', label: '6-10 people', value: '6-10' },
          { id: '11-20', label: '11-20 people', value: '11-20' },
          { id: '21-50', label: '21-50 people', value: '21-50' },
          { id: '51-100', label: '51-100 people', value: '51-100' },
          { id: '101-1000', label: '101-1000 people', value: '101-1000' },
          { id: '1000plus', label: 'More than 1000 people', value: '1000+' },
          { id: 'na', label: 'Not applicable', value: 'na' },
        ],
      },
      {
        id: 'job_title',
        type: 'single',
        prompt: 'What is your current job title or role?',
        options: [
          { id: 'frontend', label: 'Frontend Developer', value: 'frontend' },
          { id: 'backend', label: 'Backend Developer', value: 'backend' },
          { id: 'fullstack', label: 'Full Stack Developer', value: 'fullstack' },
          { id: 'devops', label: 'DevOps / SRE / Platform Engineer', value: 'devops' },
          { id: 'mobile', label: 'Mobile Developer', value: 'mobile' },
          { id: 'data', label: 'Data Scientist / ML Engineer', value: 'data' },
          { id: 'engineering-manager', label: 'Engineering Manager', value: 'engineering-manager' },
          { id: 'tech-lead', label: 'Tech Lead / Staff Engineer', value: 'tech-lead' },
          { id: 'cto', label: 'CTO / VP Engineering', value: 'cto' },
          { id: 'student', label: 'Student', value: 'student' },
          { id: 'hobbyist', label: 'Hobbyist', value: 'hobbyist' },
          { id: 'other', label: 'Other', value: 'other' },
        ],
      },
      {
        id: 'yearly_income',
        type: 'single',
        prompt: 'What is your yearly gross (pre-tax) income in U.S. dollars?',
        options: [
          { id: '0-20k', label: '$0k - $20k', value: '0-20k' },
          { id: '20-40k', label: '$20k - $40k', value: '20-40k' },
          { id: '40-60k', label: '$40k - $60k', value: '40-60k' },
          { id: '60-80k', label: '$60k - $80k', value: '60-80k' },
          { id: '80-100k', label: '$80k - $100k', value: '80-100k' },
          { id: '100-150k', label: '$100k - $150k', value: '100-150k' },
          { id: '150-200k', label: '$150k - $200k', value: '150-200k' },
          { id: '200k-plus', label: 'More than $200k', value: '200k+' },
          { id: 'na', label: 'Prefer not to say', value: 'na' },
        ],
      },
      {
        id: 'higher_education',
        type: 'single',
        prompt: 'Do you have a higher education degree?',
        options: [
          { id: 'no', label: 'No', value: 'no' },
          { id: 'yes-related', label: 'Yes, in a field related to my current profession', value: 'yes-related' },
          { id: 'yes-unrelated', label: 'Yes, but in a field unrelated to my current profession', value: 'yes-unrelated' },
        ],
      },
      {
        id: 'country',
        type: 'single',
        prompt: 'Where do you currently reside?',
        options: [
          { id: 'us', label: 'United States', value: 'us' },
          { id: 'uk', label: 'United Kingdom', value: 'uk' },
          { id: 'canada', label: 'Canada', value: 'canada' },
          { id: 'germany', label: 'Germany', value: 'germany' },
          { id: 'france', label: 'France', value: 'france' },
          { id: 'india', label: 'India', value: 'india' },
          { id: 'brazil', label: 'Brazil', value: 'brazil' },
          { id: 'australia', label: 'Australia', value: 'australia' },
          { id: 'netherlands', label: 'Netherlands', value: 'netherlands' },
          { id: 'spain', label: 'Spain', value: 'spain' },
          { id: 'poland', label: 'Poland', value: 'poland' },
          { id: 'japan', label: 'Japan', value: 'japan' },
          { id: 'china', label: 'China', value: 'china' },
          { id: 'other-europe', label: 'Other (Europe)', value: 'other-europe' },
          { id: 'other-asia', label: 'Other (Asia)', value: 'other-asia' },
          { id: 'other-africa', label: 'Other (Africa)', value: 'other-africa' },
          { id: 'other-latam', label: 'Other (Latin America)', value: 'other-latam' },
          { id: 'other', label: 'Other', value: 'other' },
        ],
      },
      {
        id: 'gender',
        type: 'single',
        prompt: 'Which one of the following options describes you?',
        description: 'We collect this data to help measure and improve the survey\'s inclusivity and representativeness.',
        options: [
          { id: 'man', label: 'Man', value: 'man' },
          { id: 'woman', label: 'Woman', value: 'woman' },
          { id: 'non-binary', label: 'Non-Binary or Gender Non-Conforming', value: 'non-binary' },
          { id: 'not-listed', label: 'Not Listed', value: 'not-listed' },
          { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
        ],
      },
      {
        id: 'ethnicity',
        type: 'multiple',
        prompt: 'Which of the following options describe you?',
        description: 'We collect this data to help measure and improve the survey\'s inclusivity and representativeness. Select all that apply.',
        options: [
          { id: 'black', label: 'Black or of African descent', value: 'black' },
          { id: 'east-asian', label: 'East Asian', value: 'east-asian' },
          { id: 'hispanic', label: 'Hispanic or Latin', value: 'hispanic' },
          { id: 'middle-eastern', label: 'Middle Eastern', value: 'middle-eastern' },
          { id: 'multiracial', label: 'Multiracial / Multiethnic', value: 'multiracial' },
          { id: 'indigenous', label: 'Native American, Pacific Islander, or Indigenous Australian', value: 'indigenous' },
          { id: 'south-asian', label: 'South Asian', value: 'south-asian' },
          { id: 'southeast-asian', label: 'South East Asian', value: 'southeast-asian' },
          { id: 'white', label: 'White / Caucasian', value: 'white' },
          { id: 'other', label: 'Other', value: 'other' },
          { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
        ],
      },
      {
        id: 'disability',
        type: 'multiple',
        prompt: 'Which of the following disabilities do you experience, if any?',
        description: 'Note that this can include temporary disabilities or injuries. Select all that apply.',
        options: [
          { id: 'visual', label: 'Visual impairments (blindness, color blindness, etc.)', value: 'visual' },
          { id: 'hearing', label: 'Hearing impairments (deafness, tinnitus, etc.)', value: 'hearing' },
          { id: 'mobility', label: 'Mobility impairments (arthritis, carpal tunnel, etc.)', value: 'mobility' },
          { id: 'neurodivergent', label: 'Neurodivergent conditions (ADHD, Autism, dyslexia, etc.)', value: 'neurodivergent' },
          { id: 'mental-health', label: 'Mental health conditions (anxiety, depression, PTSD, etc.)', value: 'mental-health' },
          { id: 'chronic-illness', label: 'Chronic illness (diabetes, autoimmune disorders, etc.)', value: 'chronic-illness' },
          { id: 'other', label: 'Other', value: 'other' },
          { id: 'none', label: 'None', value: 'none' },
          { id: 'prefer-not', label: 'Prefer not to say', value: 'prefer-not' },
        ],
      },
    ],
  },
  // === AI IDEs Section ===
  {
    id: 'ai_ides',
    title: 'AI IDEs',
    description: 'AI-native integrated development environments',
    questions: [
      {
        id: 'ai-ide-cursor',
        type: 'single',
        prompt: 'Cursor',
        description: 'AI-native IDE built on VS Code',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ai-ide-windsurf',
        type: 'single',
        prompt: 'Windsurf',
        description: 'AI IDE by Codeium',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ai-ide-zed',
        type: 'single',
        prompt: 'Zed',
        description: 'High-performance editor with AI features',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ai-ide-antigravity',
        type: 'single',
        prompt: 'Antigravity',
        description: 'AI-native development environment',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ai-ide-kiro',
        type: 'single',
        prompt: 'Kiro',
        description: 'AWS spec-driven AI IDE',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ai-ide-other',
        type: 'text',
        prompt: 'Other AI IDEs',
        description: 'Other AI IDEs you use not mentioned above',
      },
      {
        id: 'ai-ide-satisfaction',
        type: 'scale',
        prompt: 'How happy are you with AI IDEs?',
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Very Unhappy', max: 'Very Happy' },
      },
      {
        id: 'ai-ide-pain-points',
        type: 'text',
        prompt: 'What pain points have you encountered with AI IDEs?',
        description: 'Share any frustrations or challenges',
      },
    ],
  },
  // === Extensions Section ===
  {
    id: 'extensions',
    title: 'Extensions',
    description: 'AI coding extensions for existing editors',
    questions: [
      {
        id: 'ext-github-copilot',
        type: 'single',
        prompt: 'GitHub Copilot',
        description: 'AI pair programmer by GitHub/Microsoft',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ext-cline',
        type: 'single',
        prompt: 'Cline',
        description: 'Autonomous coding agent for VS Code',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ext-augment-code',
        type: 'single',
        prompt: 'Augment Code',
        description: 'AI coding assistant extension',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ext-amazon-q',
        type: 'single',
        prompt: 'Amazon Q Developer',
        description: 'AWS AI assistant (formerly CodeWhisperer)',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'ext-other',
        type: 'text',
        prompt: 'Other Extensions',
        description: 'Other AI coding extensions you use not mentioned above',
      },
      {
        id: 'ext-satisfaction',
        type: 'scale',
        prompt: 'How happy are you with AI coding extensions?',
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Very Unhappy', max: 'Very Happy' },
      },
      {
        id: 'ext-pain-points',
        type: 'text',
        prompt: 'What pain points have you encountered with AI extensions?',
        description: 'Share any frustrations or challenges',
      },
    ],
  },
  // === Autonomous Agents Section ===
  {
    id: 'autonomous_agents',
    title: 'Autonomous Agents',
    description: 'AI agents that can write code autonomously',
    questions: [
      {
        id: 'agent-claude-code',
        type: 'single',
        prompt: 'Claude Code',
        description: 'Anthropic\'s agentic coding tool',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'agent-codex',
        type: 'single',
        prompt: 'Codex',
        description: 'OpenAI\'s coding agent',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'agent-devin',
        type: 'single',
        prompt: 'Devin',
        description: 'Cognition\'s autonomous AI developer',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'agent-jules',
        type: 'single',
        prompt: 'Jules',
        description: 'Google\'s async coding agent',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'agent-openhands',
        type: 'single',
        prompt: 'OpenHands',
        description: 'Open-source autonomous coding agent',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'agent-other',
        type: 'text',
        prompt: 'Other Autonomous Agents',
        description: 'Other AI coding agents you use not mentioned above',
      },
      {
        id: 'agent-satisfaction',
        type: 'scale',
        prompt: 'How happy are you with autonomous coding agents?',
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Very Unhappy', max: 'Very Happy' },
      },
      {
        id: 'agent-pain-points',
        type: 'text',
        prompt: 'What pain points have you encountered with autonomous agents?',
        description: 'Share any frustrations or challenges',
      },
    ],
  },
  // === App Builders Section ===
  {
    id: 'app_builders',
    title: 'App Builders',
    description: 'AI tools that generate full applications',
    questions: [
      {
        id: 'builder-replit',
        type: 'single',
        prompt: 'Replit',
        description: 'AI-powered IDE and deployment platform',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'builder-lovable',
        type: 'single',
        prompt: 'Lovable',
        description: 'AI full-stack app generator',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'builder-bolt',
        type: 'single',
        prompt: 'Bolt.new',
        description: 'StackBlitz AI app builder',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'builder-v0',
        type: 'single',
        prompt: 'v0',
        description: 'Vercel\'s AI UI component generator',
        options: [
          { id: 'never-heard', label: 'Never heard of it', value: 'never-heard' },
          { id: 'heard', label: 'Heard of it', value: 'heard' },
          { id: 'used', label: 'Used it', value: 'used' },
        ],
      },
      {
        id: 'builder-other',
        type: 'text',
        prompt: 'Other App Builders',
        description: 'Other AI app builders you use not mentioned above',
      },
      {
        id: 'builder-satisfaction',
        type: 'scale',
        prompt: 'How happy are you with AI app builders?',
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: { min: 'Very Unhappy', max: 'Very Happy' },
      },
      {
        id: 'builder-pain-points',
        type: 'text',
        prompt: 'What pain points have you encountered with AI app builders?',
        description: 'Share any frustrations or challenges',
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

