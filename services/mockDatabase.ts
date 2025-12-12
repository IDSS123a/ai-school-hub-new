import { PromptDefinition } from '../types';

export const PROMPT_DEFINITIONS: PromptDefinition[] = [
  {
    id: 'lesson-planner',
    title: 'Lesson Planner',
    category: 'Core Planning',
    description: 'Design comprehensive lesson plans with clear objectives and activities. Example Usage: Subject: History, Grade: 8, Topic: The Industrial Revolution, Objectives: Understand urbanization effects.',
    icon: 'NotebookPen',
    fields: [
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'e.g. History' },
      { key: 'grade', label: 'Grade Level', type: 'select', options: ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] },
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. The Cold War' },
      { key: 'duration', label: 'Duration (mins)', type: 'number', defaultValue: '60' },
      { key: 'objectives', label: 'Learning Objectives', type: 'textarea', placeholder: 'What will students learn?' }
    ],
    systemInstruction: `You are an expert pedagogical consultant. Create a detailed lesson plan based on the user's input.
    
    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags (like <h1>, <b>, <br>).
    3. DO NOT use Markdown syntax (like **, ##, [], or * for bullets).
    4. Use standard dashes (-) for bullet points.
    5. Use standard numbering (1., 2., 3.) for lists.
    6. Use CAPITALIZATION and spacing to distinguish headings and sections.
    7. Format it to look like a professional MS Word document.

    Include the following sections:
    LESSON OVERVIEW
    SWBAT (Students Will Be Able To)
    ESSENTIAL QUESTIONS
    MATERIALS NEEDED
    LESSON PROCEDURE (Hook, Direct Instruction, Guided Practice, Independent Practice, Closure)
    ASSESSMENT METHODS`
  },
  {
    id: 'interdisciplinary-project',
    title: 'Interdisciplinary Project Planner',
    category: 'Core Planning',
    description: 'Create projects that span multiple subjects and learning domains. Example Usage: Subjects: Math & Physics, Theme: Building Bridges, Grade: 9, Deliverables: Scale Model & Report.',
    icon: 'Layers',
    fields: [
      { key: 'subjects', label: 'Subjects Involved', type: 'text', placeholder: 'e.g. Math & Art' },
      { key: 'grade', label: 'Grade Level', type: 'text', defaultValue: '9' },
      { key: 'theme', label: 'Project Theme/Topic', type: 'text', placeholder: 'e.g. Golden Ratio in Nature' },
      { key: 'duration', label: 'Project Duration', type: 'text', defaultValue: '2 weeks' },
      { key: 'deliverables', label: 'Expected Deliverables', type: 'textarea', placeholder: 'What will students create?' }
    ],
    systemInstruction: `Design a robust Interdisciplinary Project Plan.
    Focus on authentic connections between the specified subjects.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax (no **, ##, etc.).
    3. Use CAPITALIZED HEADINGS for structure.
    4. Use dashes (-) for bullet points.

    Include:
    PROJECT SUMMARY & DRIVING QUESTION
    SUBJECT-SPECIFIC STANDARDS
    THE ENTRY EVENT (LAUNCH)
    PROJECT MILESTONES & TIMELINE
    FINAL PRODUCT DESCRIPTION
    ASSESSMENT RUBRIC CRITERIA`
  },
  {
    id: 'edu-material-advisor',
    title: 'Educational Material Advisor',
    category: 'Resources',
    description: 'Get recommendations for resources, tools, and content strategies. Example Usage: Topic: Photosynthesis, Audience: 5th Grade, Resource Type: Videos & Interactive, Goal: Visualize cellular process.',
    icon: 'LibraryBig',
    fields: [
      { key: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g. Quantum Mechanics' },
      { key: 'target_audience', label: 'Target Audience', type: 'text', placeholder: 'e.g. AP Physics Students' },
      { key: 'resource_types', label: 'Resource Types Needed', type: 'select', options: ['Videos & Multimedia', 'Articles & Readings', 'Interactive Simulations', 'Worksheets & Practice', 'All of the above'] },
      { key: 'learning_goal', label: 'Specific Learning Goal', type: 'textarea' }
    ],
    systemInstruction: `You are an Educational Resources Curator.
    Provide a curated list of high-quality material recommendations for the specified topic.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Format as a professional document suitable for printing.

    For each resource suggestion, include:
    TITLE/TYPE
    Description of how to use it
    Why it is effective for this specific audience
    Suggested differentiation for struggling learners`
  },
  {
    id: 'event-planner',
    title: 'Event Planner',
    category: 'Logistics',
    description: 'Plan school events, assemblies, or open houses. Example Usage: Event: Science Fair, Audience: Parents & Students, Budget: Low, Goals: Showcase student innovation.',
    icon: 'CalendarCheck',
    fields: [
      { key: 'event_name', label: 'Event Name', type: 'text', placeholder: 'e.g. Science Fair' },
      { key: 'date', label: 'Date/Time', type: 'text' },
      { key: 'audience', label: 'Target Audience', type: 'select', options: ['Students', 'Parents', 'Staff', 'Community', 'Mixed'] },
      { key: 'budget', label: 'Budget/Constraints', type: 'textarea', placeholder: 'e.g. Low budget, gym location' },
      { key: 'goals', label: 'Event Goals', type: 'textarea' }
    ],
    systemInstruction: `Act as a School Event Coordinator. Create a detailed Event Plan.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Use spacing and capitalization to organize the document.

    Include:
    EVENT BRIEF & OBJECTIVES
    TIMELINE/RUN OF SHOW
    LOGISTICS CHECKLIST (Venue, AV, Food, Safety)
    COMMUNICATION PLAN
    VOLUNTEER/STAFF ROLES`
  },
  {
    id: 'field-trip-planner',
    title: 'Field Trip Planner',
    category: 'Logistics',
    description: 'Organize educational excursions with itinerary and safety checks. Example Usage: Destination: Natural History Museum, Grade: 4, Logistics: 2 Buses, Curriculum Link: Dinosaurs & Fossils.',
    icon: 'Bus',
    fields: [
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'grade', label: 'Grade Level', type: 'text' },
      { key: 'curriculum_link', label: 'Curriculum Connection', type: 'textarea', placeholder: 'How does this relate to classwork?' },
      { key: 'logistics', label: 'Logistical Constraints', type: 'textarea', placeholder: 'e.g. 2 buses, sack lunches needed' }
    ],
    systemInstruction: `Create a comprehensive Field Trip Itinerary and Planning Document.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Use standard numbering and dashes for lists.

    Sections:
    EDUCATIONAL RATIONALE
    PRE-TRIP ACTIVITIES
    DAY-OF ITINERARY
    SAFETY & RISK MANAGEMENT CHECKLIST
    POST-TRIP REFLECTION ACTIVITY`
  },
  {
    id: 'writing-assistant',
    title: 'Writing Assistant',
    category: 'Consulting',
    description: 'Draft emails, newsletters, grant proposals, or reports. Example Usage: Type: Parent Newsletter, Tone: Warm/Community, Key Points: Upcoming Winter Break & Charity Drive.',
    icon: 'Feather',
    fields: [
      { key: 'doc_type', label: 'Document Type', type: 'select', options: ['Parent Newsletter', 'Grant Proposal', 'Recommendation Letter', 'Administrative Report', 'Press Release'] },
      { key: 'audience', label: 'Audience', type: 'text' },
      { key: 'key_points', label: 'Key Points to Cover', type: 'textarea' },
      { key: 'tone', label: 'Tone', type: 'select', options: ['Professional', 'Warm/Community', 'Persuasive', 'Formal'] }
    ],
    systemInstruction: `You are a professional Communications Assistant for educators.
    Draft the requested document.
    
    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Ensure the tone is perfectly aligned with the selection.
    
    Focus on clarity, professionalism, and impact. Use standard business letter or newsletter formatting using only text and spacing.`
  },
  {
    id: 'expert-consultant',
    title: 'Expert Consultant',
    category: 'Consulting',
    description: 'Get expert advice on pedagogical or psychological challenges. Example Usage: Role: Child Psychologist, Situation: Student anxiety during tests, Question: Coping strategies for 10-year-olds.',
    icon: 'GraduationCap',
    fields: [
      { key: 'role', label: 'Consultant Role', type: 'select', options: ['Child Psychologist', 'Curriculum Director', 'EdTech Specialist', 'Behavioral Analyst', 'Diversity & Inclusion Officer'] },
      { key: 'context', label: 'Situation/Context', type: 'textarea', placeholder: 'Describe the situation...' },
      { key: 'question', label: 'Specific Question', type: 'textarea', placeholder: 'What advice do you need?' }
    ],
    systemInstruction: `Adopt the persona of the selected Consultant Role.
    Provide expert, evidence-based advice for the situation described.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Use CAPITALIZED SECTIONS for readability.

    Structure your response:
    ANALYSIS OF THE SITUATION
    THEORETICAL/EVIDENCE BASE
    ACTIONABLE RECOMMENDATIONS
    LONG-TERM CONSIDERATIONS`
  },
  {
    id: 'math-planner-ibmyp',
    title: 'Math Planner (IBMYP)',
    category: 'Specialized',
    description: 'Design IB Middle Years Programme math units and assessments. Example Usage: Grade: MYP 3, Topic: Linear Equations, Global Context: Scientific Innovation, Key Concept: Relationships.',
    icon: 'Sigma',
    fields: [
      { key: 'grade', label: 'MYP Year/Grade', type: 'select', options: ['MYP 1', 'MYP 2', 'MYP 3', 'MYP 4', 'MYP 5'] },
      { key: 'topic', label: 'Topic', type: 'text' },
      { key: 'key_concept', label: 'Key Concept', type: 'select', options: ['Form', 'Logic', 'Relationships'] },
      { key: 'global_context', label: 'Global Context', type: 'select', options: ['Identities and relationships', 'Orientation in space and time', 'Personal and cultural expression', 'Scientific and technical innovation', 'Globalization and sustainability', 'Fairness and development'] },
      { key: 'inquiry_statement', label: 'Statement of Inquiry', type: 'textarea' }
    ],
    systemInstruction: `Create an IB MYP Mathematics Unit Plan.
    Strictly follow IB terminology and structure.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Use standard spacing and formatting.

    Include:
    STATEMENT OF INQUIRY (incorporating Key Concept, Related Concepts, and Global Context)
    APPROACHES TO LEARNING (ATL) SKILLS
    CONTENT/TOPICS
    ASSESSMENT CRITERIA (A, B, C, D) ALIGNMENT
    FORMATIVE AND SUMMATIVE ASSESSMENT IDEAS`
  },
  {
    id: 'elt-mentor',
    title: 'ELT Mentor (Scrivener)',
    category: 'Specialized',
    description: 'Support for English Language Teaching lesson design and scaffolding. Example Usage: Level: B1, Skill: Speaking, Topic: Travel Plans, Age: Teens.',
    icon: 'Languages',
    fields: [
      { key: 'cefr_level', label: 'CEFR Level', type: 'select', options: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
      { key: 'skill_focus', label: 'Skill Focus', type: 'select', options: ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary'] },
      { key: 'topic', label: 'Lesson Topic', type: 'text' },
      { key: 'student_age', label: 'Age Group', type: 'select', options: ['Young Learners', 'Teens', 'Adults'] }
    ],
    systemInstruction: `You are an expert ELT (English Language Teaching) Mentor.
    Design a lesson or activity plan suitable for the specified CEFR level.
    Ensure strict vocabulary and grammar grading appropriate for the level.

    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.

    Include:
    TARGET LANGUAGE (Lexis/Grammar)
    SCAFFOLDING TECHNIQUES
    INTERACTION PATTERNS (T-S, S-S)
    CONCEPT CHECKING QUESTIONS (CCQs)
    PROCEDURE`
  },
  {
    id: 'business-doc-assistant',
    title: 'Business Document Assistant',
    category: 'Administration',
    description: 'Create operational documents, memos, and agendas. Example Usage: Type: Meeting Agenda, Audience: Staff, Objectives: Budget Review & New Hire Announcements.',
    icon: 'Briefcase',
    fields: [
      { key: 'doc_type', label: 'Document Type', type: 'select', options: ['Meeting Agenda', 'Policy Memo', 'Strategic Plan', 'Budget Proposal', 'Staff Handbook Section'] },
      { key: 'audience', label: 'Audience', type: 'text' },
      { key: 'objectives', label: 'Objectives/Key Info', type: 'textarea' }
    ],
    systemInstruction: `Act as a School Administrator's Chief of Staff.
    Draft the requested business document.
    Ensure a highly professional, organized, and clear corporate/academic tone.
    
    STRICT FORMATTING RULES:
    1. Output as clean, professional plain text only.
    2. DO NOT use HTML tags or Markdown syntax.
    3. Use clear capitalization for headings.
    4. Use dashes (-) for bullet points.
    5. No bold or italic symbols (like ** or _).`
  }
];

export const getPromptById = (id: string) => PROMPT_DEFINITIONS.find(p => p.id === id);