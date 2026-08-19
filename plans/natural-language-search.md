Natural Language + Standard Applicant Search

1. Objective

The applicant search functionality should support both traditional keyword-based search and AI-powered natural language search through a single search input.

The system should allow recruiters to search applicants using structured information such as name, skills, experience, location, company, and status, while also allowing them to describe the type of candidate they are looking for using natural language.

The search engine should interpret the user's query, identify relevant candidate attributes, retrieve matching applicants, and rank results based on relevance.

2. Scope

The search functionality will support:

Standard keyword search

Natural language search

Candidate attribute extraction

Semantic candidate matching

Search across candidate profile, resume, application, skills, experience, education, screening responses, and other available candidate data

Relevance-based candidate ranking

Combination of structured and natural-language criteria

AI-generated interpretation of complex search queries

3. Standard Search

The system must support traditional search queries without requiring AI interpretation.

Users should be able to search using:

Candidate name

Email

Phone number

Current/previous company

Job title

Skills

Location

Education

Keywords from resume

Application status

Experience

Readiness score

Examples

Query

Expected behavior

Sarah Chen

Find candidates matching the name

React

Find candidates with React

Google

Find candidates associated with Google

San Francisco

Find candidates in San Francisco

5 years

Find candidates with approximately 5+ years experience

Shortlisted

Return shortlisted candidates

React TypeScript

Return candidates matching either/both relevant skills

Standard search should remain functional even if AI services are unavailable.

4. Natural Language Search

The system must allow users to enter a complete natural-language query describing the candidate they are looking for.

The AI search engine should understand:

Skills

Years of experience

Job titles

Seniority

Location

Companies

Education

Industry/domain experience

Employment history

Application status

Readiness score

Competency match

Skill gaps

Screening responses

Work authorization

Workplace preference

Salary expectations

Candidate achievements

Semantic concepts that cannot be represented by a simple keyword

Examples

Find React developers with at least 5 years of experience

Show me the strongest frontend candidates

Candidates with React and TypeScript experience

Find candidates who worked at product companies

Show candidates who match the core requirements but have some gaps

Find candidates who can work onsite in San Francisco

Show candidates with strong frontend skills and experience building scalable applications

Find candidates who are a strong match for this job but don't necessarily have every preferred skill

5. Query Understanding

For every natural-language query, the AI should determine:

5.1 Intent

Identify what the recruiter is trying to accomplish.

Examples:

Candidate discovery

Candidate filtering

Candidate ranking

Skill matching

Experience matching

JD matching

Gap identification

5.2 Structured Criteria

Extract explicit criteria from the query.

Example:

"Find senior React developers in San Francisco with 5+ years of experience"

Should produce approximately:

Role: Frontend Developer
Seniority: Senior
Skill: React
Location: San Francisco
Experience: >= 5 years

5.3 Semantic Criteria

The system should preserve concepts that cannot be represented as simple filters.

Example:

"Find candidates who have built scalable frontend applications"

The system should use semantic matching against resumes, experience descriptions, projects, achievements, and other candidate data.

6. Job-Aware Search

Natural-language search should have access to the current job's context.

The system should be able to use:

Job title

Job description

Required skills

Preferred skills

Experience requirement

Location

Workplace type

Job type

Screening questions

Competency framework

Readiness score

This allows queries such as:

"Show me candidates who are the best fit for this role."

The AI should evaluate candidates against the current job rather than performing generic candidate search.

7. Candidate Ranking

When multiple candidates match the query, results should be ranked by relevance.

Ranking should consider:

Query relevance

Job relevance

Required skill match

Preferred skill match

Experience match

Seniority match

Location/workplace compatibility

Screening-question results

Competency match

Readiness score

Relevant career experience

Semantic similarity

The ranking system should not rely solely on keyword frequency.

8. Search Across Candidate Data

Search should operate across all relevant candidate information available in Qelsa.

Candidate Profile

Name

Headline

Location

Current role

Skills

Experience

Education

Resume

Summary

Work experience

Responsibilities

Achievements

Projects

Skills

Education

Certifications

Application

Cover letter

Application responses

Screening questions

Expected salary

Availability

Work authorization

Workplace preference

Qelsa Intelligence

Readiness score

Competency framework

Skill proficiency

Skill gaps

JD match

AI-generated candidate insights

9. Structured + Natural Language Queries

The system must support queries containing both structured and semantic criteria.

Example:

React developers with 5+ years who are strong matches for this role but have limited AWS experience

The system should identify:

Skill: React
Experience: >= 5 years
Job Match: Strong
Skill Gap: AWS

and apply semantic interpretation where necessary.

10. Search Result Relevance

The search engine should return only candidates that are meaningfully relevant to the query.

For example:

Query:

Senior React developers with 5+ years

A candidate with:

6 years experience

React expertise

Senior Frontend Developer title

should rank significantly higher than:

3 years experience

React listed as a basic skill

11. AI Search Explanation

For natural-language searches, the system should be able to explain why a candidate was considered relevant.

Example:

Sarah Chen — 92% readiness

Strong match because she has 6 years of frontend experience, expert-level React proficiency, and experience building scalable applications.

Gap: AWS experience is below the preferred level.

The explanation should be generated from actual candidate data and must not invent candidate qualifications.

12. Search Performance

Standard Search

Target response time:

< 500 ms for common keyword/structured searches.

Natural Language Search

Target response time:

< 3–5 seconds for AI-powered searches.

The system should provide useful results even when AI processing takes longer.

13. Search Architecture

The search system should use a hybrid architecture:

Keyword / Structured Search

Used for deterministic attributes:

Name

Email

Skills

Location

Experience

Status

Company

Job title

Semantic Search

Used for:

Resume meaning

Experience similarity

Skill relationships

Candidate capabilities

Project experience

Achievement relevance

LLM Query Parser

Used to convert natural-language queries into structured search criteria and semantic search instructions.

Ranking Layer

Combines:

Keyword relevance +
Structured filter match +
Semantic similarity +
Job competency match +
Candidate readiness

to produce the final candidate ranking.

14. Failure Handling

If the system cannot confidently interpret a natural-language query, it should fall back to keyword search where possible.

Example:

frontend people who know the stuff needed for modern apps

The system should attempt semantic interpretation rather than failing completely.

If interpretation confidence is low, the system should not make unsupported assumptions about candidate requirements.

15. Security & Permissions

Search results must respect the recruiter's existing permissions.

Users must only be able to search candidates they are authorized to access.

The AI search system must not expose restricted candidate information through:

Search results

AI explanations

Ranking

Generated summaries

16. Acceptance Criteria

The feature will be considered complete when:

Users can perform standard keyword searches.

Users can perform natural-language searches using the same search capability.

The system can extract structured criteria from natural-language queries.

The system can perform semantic matching against candidate data.

Search can use the current job's requirements as context.

Candidates are ranked according to query relevance.

Structured and semantic criteria can be combined.

Search operates across resumes, profiles, applications, screening responses, and Qelsa intelligence.

AI-generated explanations are grounded in candidate data.

Standard search continues to work if AI services are unavailable.

Search respects candidate access permissions.

Search results meet the defined performance targets.
