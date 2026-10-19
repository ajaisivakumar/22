export interface ElectiveCategory {
  category: string;
  courses: string[];
}

export const PROGRAMME_ELECTIVES: Record<string, string[]> = {
  'Artificial Intelligence': [
    'Computational Intelligent Techniques',
    'Intelligent Transportation Systems',
    'Generative AI and Prompt Engineering',
    'Responsible and Equitable AI',
    'Reactive Machines and Self-aware AI',
  ],
  'Data Analytics': [
    'Big Data Analytics',
    'Recommender Systems',
    'Image and Video Analytics',
    'Text and Speech Analytics',
    'Bioinformatics',
  ],
  'Product Development': [
    'Design Thinking and Innovation',
    'UI and UX Design and Human-centered Design',
    'Java Spring Boot',
    'DevOps',
    'Vibe Coding',
  ],
  'Security': [
    'Information Security',
    'Privacy in Communication Networks',
    'Mobile Forensics',
    'Web and IoT Security',
    'Cryptocurrency and Blockchain Technologies',
  ],
  'Computing': [
    'Cloud Computing',
    'Augmented Reality / Virtual Reality',
    'Edge and Fog Computing',
    'Granular Computing',
    'Quantum Computing',
  ],
  'IoT': [
    'Dynamic Paradigm for IoT',
    'Smart IoT Architecture',
    'Wearable Computing',
    'IoT in 5G Networks',
    'IoT and Smart Cities',
  ],
};
