// Mock learning resources for placeholder UI

import type { LearningResource, ResourceAttachment } from '@/types/resource'

export const mockResources: LearningResource[] = [
  // ── sec-001: HCI (DIT7044) ──────────────────────────────────────
  { id: 'res-001', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Week 1 - Introduction to HCI', description: 'Lecture slides covering HCI principles and history.', type: 'slide', isPublished: true, createdAt: '2023-09-05T09:00:00Z', updatedAt: '2023-09-05T09:00:00Z' },
  { id: 'res-002', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Week 2 - User Research Methods', description: 'Lecture slides on user interviews, surveys, and contextual inquiry.', type: 'slide', isPublished: true, createdAt: '2023-09-12T09:00:00Z', updatedAt: '2023-09-12T09:00:00Z' },
  { id: 'res-003', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Week 3 - Prototyping & Wireframing', description: 'Slides on low-fi vs high-fi prototyping approaches.', type: 'slide', isPublished: true, createdAt: '2023-09-19T09:00:00Z', updatedAt: '2023-09-19T09:00:00Z' },
  { id: 'res-004', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Tutorial 1 - User Research Practice', description: 'Hands-on exercises for conducting user interviews and affinity mapping.', type: 'tutorial', isPublished: true, createdAt: '2023-09-13T09:00:00Z', updatedAt: '2023-09-13T09:00:00Z' },
  { id: 'res-005', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Tutorial 2 - Usability Evaluation', description: 'Heuristic evaluation exercise using Nielsen\'s 10 usability principles.', type: 'tutorial', isPublished: true, createdAt: '2023-09-20T09:00:00Z', updatedAt: '2023-09-20T09:00:00Z' },
  { id: 'res-006', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Assignment 1 - Persona & User Journey Map', description: 'Create personas and a user journey map for a library management system.', type: 'assignment', isPublished: true, createdAt: '2023-09-15T09:00:00Z', updatedAt: '2023-09-15T09:00:00Z' },
  { id: 'res-007', courseSectionId: 'sec-001', uploadedBy: 'lec-001', title: 'Assignment 2 - Prototype & Usability Report', description: 'Design a mid-fidelity prototype and conduct a usability test.', type: 'assignment', isPublished: true, createdAt: '2023-09-28T09:00:00Z', updatedAt: '2023-09-28T09:00:00Z' },

  // ── sec-002: DBMS (DIT7021) ─────────────────────────────────────
  { id: 'res-008', courseSectionId: 'sec-002', uploadedBy: 'lec-002', title: 'Week 1 - Introduction to Databases', description: 'Relational model, DBMS concepts, and SQL overview.', type: 'slide', isPublished: true, createdAt: '2023-09-06T10:00:00Z', updatedAt: '2023-09-06T10:00:00Z' },
  { id: 'res-009', courseSectionId: 'sec-002', uploadedBy: 'lec-002', title: 'Week 2 - SQL: DDL & DML', description: 'CREATE, ALTER, INSERT, UPDATE, DELETE statements with examples.', type: 'slide', isPublished: true, createdAt: '2023-09-13T10:00:00Z', updatedAt: '2023-09-13T10:00:00Z' },
  { id: 'res-010', courseSectionId: 'sec-002', uploadedBy: 'lec-002', title: 'Tutorial 1 - Basic SQL Queries', description: 'Practice SELECT with WHERE, ORDER BY, GROUP BY, and JOIN clauses.', type: 'tutorial', isPublished: true, createdAt: '2023-09-14T10:00:00Z', updatedAt: '2023-09-14T10:00:00Z' },
  { id: 'res-011', courseSectionId: 'sec-002', uploadedBy: 'lec-002', title: 'Assignment 1 - ER Diagram Design', description: 'Design an entity-relationship diagram for a hospital management system.', type: 'assignment', isPublished: true, createdAt: '2023-09-17T10:00:00Z', updatedAt: '2023-09-17T10:00:00Z' },

  // ── sec-003: WAD (DIT7031) ──────────────────────────────────────
  { id: 'res-012', courseSectionId: 'sec-003', uploadedBy: 'lec-003', title: 'Week 1 - HTML5 & CSS3 Fundamentals', description: 'Core HTML5 elements, semantic markup, and CSS3 properties.', type: 'slide', isPublished: true, createdAt: '2023-09-07T11:00:00Z', updatedAt: '2023-09-07T11:00:00Z' },
  { id: 'res-013', courseSectionId: 'sec-003', uploadedBy: 'lec-003', title: 'Week 2 - Responsive Web Design', description: 'Flexbox, CSS Grid, and media queries for responsive layouts.', type: 'slide', isPublished: true, createdAt: '2023-09-14T11:00:00Z', updatedAt: '2023-09-14T11:00:00Z' },
  { id: 'res-014', courseSectionId: 'sec-003', uploadedBy: 'lec-003', title: 'Lab 1 - Build a Portfolio Page', description: 'Build a simple personal portfolio webpage using HTML5 and CSS3.', type: 'exercise', isPublished: true, createdAt: '2023-09-14T11:00:00Z', updatedAt: '2023-09-14T11:00:00Z' },
  { id: 'res-015', courseSectionId: 'sec-003', uploadedBy: 'lec-003', title: 'Lab 2 - Responsive Layout Challenge', description: 'Convert a fixed-width layout to fully responsive using CSS Grid.', type: 'exercise', isPublished: true, createdAt: '2023-09-21T11:00:00Z', updatedAt: '2023-09-21T11:00:00Z' },
  { id: 'res-016', courseSectionId: 'sec-003', uploadedBy: 'lec-003', title: 'Assignment 1 - Responsive Multi-Page Website', description: 'Design and develop a responsive 4-page website on a topic of your choice.', type: 'assignment', isPublished: true, createdAt: '2023-09-18T11:00:00Z', updatedAt: '2023-09-18T11:00:00Z' },

  // ── sec-001: HCI (DIT7044) — lec-005 draft ──────────────────────
  { id: 'res-017', courseSectionId: 'sec-001', uploadedBy: 'lec-005', title: 'Week 4 - Interaction Design Patterns', description: 'Draft slides covering common interaction design patterns and anti-patterns.', type: 'slide', isPublished: false, createdAt: '2023-09-26T10:00:00Z', updatedAt: '2023-09-26T10:00:00Z' },

  // ── sec-003: WAD (DIT7031) — lec-005 draft ──────────────────────
  { id: 'res-018', courseSectionId: 'sec-003', uploadedBy: 'lec-005', title: 'Week 3 - JavaScript Frameworks Overview', description: 'Draft slides comparing React, Vue, and Angular for modern web development.', type: 'slide', isPublished: false, createdAt: '2023-09-21T12:00:00Z', updatedAt: '2023-09-21T12:00:00Z' },
]

export const mockAttachments: ResourceAttachment[] = [
  // sec-001 attachments
  { id: 'att-001', resourceId: 'res-001', originalFilename: 'week1-intro-hci.pdf', mimeType: 'application/pdf', fileSizeBytes: 2_456_789, downloadCount: 34 },
  { id: 'att-002', resourceId: 'res-002', originalFilename: 'week2-user-research.pdf', mimeType: 'application/pdf', fileSizeBytes: 1_890_234, downloadCount: 28 },
  { id: 'att-003', resourceId: 'res-003', originalFilename: 'week3-prototyping.pdf', mimeType: 'application/pdf', fileSizeBytes: 3_102_456, downloadCount: 21 },
  { id: 'att-004', resourceId: 'res-004', originalFilename: 'tutorial1-user-research.pdf', mimeType: 'application/pdf', fileSizeBytes: 890_456, downloadCount: 40 },
  { id: 'att-005', resourceId: 'res-005', originalFilename: 'tutorial2-usability-eval.pdf', mimeType: 'application/pdf', fileSizeBytes: 756_123, downloadCount: 33 },
  { id: 'att-006', resourceId: 'res-006', originalFilename: 'assignment1-brief.pdf', mimeType: 'application/pdf', fileSizeBytes: 567_890, downloadCount: 52 },
  { id: 'att-007', resourceId: 'res-007', originalFilename: 'assignment2-brief.pdf', mimeType: 'application/pdf', fileSizeBytes: 612_345, downloadCount: 47 },
  // sec-002 attachments
  { id: 'att-008', resourceId: 'res-008', originalFilename: 'week1-intro-databases.pdf', mimeType: 'application/pdf', fileSizeBytes: 1_234_567, downloadCount: 19 },
  { id: 'att-009', resourceId: 'res-009', originalFilename: 'week2-sql-ddl-dml.pdf', mimeType: 'application/pdf', fileSizeBytes: 2_045_678, downloadCount: 15 },
  { id: 'att-010', resourceId: 'res-010', originalFilename: 'tutorial1-sql-queries.pdf', mimeType: 'application/pdf', fileSizeBytes: 678_901, downloadCount: 27 },
  { id: 'att-011', resourceId: 'res-011', originalFilename: 'assignment1-er-diagram.pdf', mimeType: 'application/pdf', fileSizeBytes: 345_678, downloadCount: 38 },
  // sec-003 attachments
  { id: 'att-012', resourceId: 'res-012', originalFilename: 'week1-html5-css3.pdf', mimeType: 'application/pdf', fileSizeBytes: 3_012_345, downloadCount: 12 },
  { id: 'att-013', resourceId: 'res-013', originalFilename: 'week2-responsive-design.pdf', mimeType: 'application/pdf', fileSizeBytes: 2_567_890, downloadCount: 9 },
  { id: 'att-014', resourceId: 'res-014', originalFilename: 'lab1-portfolio.pdf', mimeType: 'application/pdf', fileSizeBytes: 456_789, downloadCount: 18 },
  { id: 'att-015', resourceId: 'res-015', originalFilename: 'lab2-responsive-challenge.pdf', mimeType: 'application/pdf', fileSizeBytes: 523_456, downloadCount: 14 },
  { id: 'att-016', resourceId: 'res-016', originalFilename: 'assignment1-website-brief.pdf', mimeType: 'application/pdf', fileSizeBytes: 789_012, downloadCount: 31 },
]
