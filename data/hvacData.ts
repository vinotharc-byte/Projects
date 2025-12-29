import { Project, Bucket, Task, Priority, Status } from '../types';

// Helper for dates
const today = new Date();
const dateStr = (offset: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return d.toISOString().split('T')[0];
};

const HVAC_BUCKETS: Bucket[] = [
    { id: 'hvac_b1', name: 'Site Survey & Engineering' },
    { id: 'hvac_b2', name: 'Procurement' },
    { id: 'hvac_b3', name: 'Demolition & Prep' },
    { id: 'hvac_b4', name: 'Installation' },
    { id: 'hvac_b5', name: 'Commissioning' },
];

export const HVAC_TASKS: Task[] = [
    // Bucket 1: Engineering
    {
        id: 'hvac_t1', title: 'Detailed Heat Load Calculation', description: 'Re-verify peak cooling load for east wing imaging center.', bucketId: 'hvac_b1',
        priority: Priority.HIGH, status: Status.COMPLETED,
        startDate: dateStr(-45), dueDate: dateStr(-40), effort: 24, assignee: 'Robert Chen', allocation: 100, labels: ['Engineering']
    },
    {
        id: 'hvac_t2', title: 'Ductwork Fabrication Drawings', description: 'Generate 3D shop drawings for main supply trunks.', bucketId: 'hvac_b1',
        priority: Priority.MEDIUM, status: Status.COMPLETED,
        startDate: dateStr(-40), dueDate: dateStr(-30), effort: 40, assignee: 'Maria Rodriguez', allocation: 100, labels: ['Design', 'CAD']
    },

    // Bucket 2: Procurement
    {
        id: 'hvac_t3', title: 'Approve Chiller Submittals', description: 'Review specs for 500-ton magnetic bearing chillers.', bucketId: 'hvac_b2',
        priority: Priority.URGENT, status: Status.COMPLETED,
        startDate: dateStr(-35), dueDate: dateStr(-33), effort: 8, assignee: 'Robert Chen', allocation: 100, labels: ['Procurement']
    },
    {
        id: 'hvac_t4', title: 'Order VAV Boxes', description: 'Lead time 6 weeks. Order batch for floors 1-5.', bucketId: 'hvac_b2',
        priority: Priority.HIGH, status: Status.IN_PROGRESS,
        startDate: dateStr(-30), dueDate: dateStr(-29), effort: 4, assignee: 'Lisa Chang', allocation: 50, labels: ['Procurement']
    },

    // Bucket 3: Demolition
    {
        id: 'hvac_t5', title: 'Crane Lift Plan Approval', description: 'City permit for weekend street closure.', bucketId: 'hvac_b3',
        priority: Priority.URGENT, status: Status.IN_PROGRESS,
        startDate: dateStr(-5), dueDate: dateStr(5), effort: 12, assignee: 'James Ford', allocation: 50, labels: ['Safety', 'Admin']
    },
    {
        id: 'hvac_t6', title: 'Demo Existing Cooling Towers', description: 'Remove 3 cells from roof. Req crane.', bucketId: 'hvac_b3',
        priority: Priority.HIGH, status: Status.NOT_STARTED,
        startDate: dateStr(6), dueDate: dateStr(8), effort: 32, assignee: 'Tom Baker', allocation: 100, labels: ['Demo', 'Site Work'], predecessors: ['hvac_t5']
    },

    // Bucket 4: Installation
    {
        id: 'hvac_t7', title: 'Install Chilled Water Piping - B1', description: '10-inch steel piping in mechanical room.', bucketId: 'hvac_b4',
        priority: Priority.MEDIUM, status: Status.NOT_STARTED,
        startDate: dateStr(10), dueDate: dateStr(25), effort: 120, assignee: 'Robert Chen', allocation: 25, labels: ['Mechanical']
    },
    {
        id: 'hvac_t8', title: 'Hang Ductwork - Floor 3', description: 'Main supply loop.', bucketId: 'hvac_b4',
        priority: Priority.MEDIUM, status: Status.NOT_STARTED,
        startDate: dateStr(15), dueDate: dateStr(30), effort: 160, assignee: 'Tom Baker', allocation: 100, labels: ['Mechanical']
    },

    // Bucket 5: Commissioning
    {
        id: 'hvac_t9', title: 'TAB (Test, Adjust, Balance)', description: 'Airside balancing for floors 1-3.', bucketId: 'hvac_b5',
        priority: Priority.MEDIUM, status: Status.NOT_STARTED,
        startDate: dateStr(40), dueDate: dateStr(50), effort: 40, assignee: 'Emily White', allocation: 100, labels: ['Commissioning']
    }
];

export const HVAC_PROJECT: Project = {
    id: 'hvac_demo_1',
    name: 'Downtown Medical Center - HVAC Retrofit',
    description: 'Comprehensive upgrade of HVAC systems for the 15-story medical tower. Scope includes replacement of 3 water-cooled chillers, cooling towers, and upgrade to HEPA filtration for OR suites.',
    manager: 'Robert Chen', // Demo user as manager
    status: 'Active',
    startDate: dateStr(-45),
    dueDate: dateStr(60),
    buckets: HVAC_BUCKETS,
    tasks: HVAC_TASKS,
    raci: {
        'Robert Chen': { 'hvac_b1': 'A', 'hvac_b2': 'A', 'hvac_b4': 'C' },
        'James Ford': { 'hvac_b3': 'R' }, // Construction/Demo lead
        'Maria Rodriguez': { 'hvac_b1': 'R' }, // Design lead
        'Lisa Chang': { 'hvac_b2': 'R' } // Procurement lead
    },
    risks: [
        {
            id: 'hvac_r1',
            description: 'Asbestos findings in B1 mechanical room pipe insulation.',
            probability: 'High',
            impact: 'High',
            owner: 'James Ford',
            mitigationAction: ' abatement contractor scheduled for standby.',
            status: 'Open'
        },
        {
            id: 'hvac_r2',
            description: 'Chiller manufacturing delay (supply chain).',
            probability: 'Medium',
            impact: 'High',
            owner: 'Lisa Chang',
            mitigationAction: 'Weekly check-ins with York factory rep.',
            status: 'Mitigated'
        }
    ],
    scopeChanges: [
        {
            id: 'hvac_sc1',
            date: dateStr(-10),
            title: 'Added Negative Pressure Rooms',
            description: 'Hospital requested 4 additional negative pressure isolation rooms on Floor 5 due to revised infectious disease protocols.',
            impact: '+$45k, +1 Week Sched'
        }
    ],
    discussions: [
        {
            id: 'hvac_d1',
            author: 'James Ford',
            text: 'Found a piping clash in the ceiling void on Floor 3. Fire sprinkler main is running right where our supply duct was designed.',
            timestamp: dateStr(-2),
            isActionItem: true,
            actionStatus: 'Open',
            replies: [
                {
                    id: 'hvac_d1_r1',
                    author: 'Maria Rodriguez',
                    text: 'I can re-route the duct around column line F. Will send updated sketch/RFI today.',
                    timestamp: dateStr(-1)
                }
            ]
        }
    ],
    actionItems: [
        {
            id: 'hvac_ai1',
            title: 'Submit updated crane lift plan to City',
            owner: 'James Ford',
            dueDate: dateStr(2),
            status: 'Open',
            sourceCommentId: 'hvac_d1'
        }
    ]
};
