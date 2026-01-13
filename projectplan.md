# Time Off Management Application - Project Plan

## Overview

A Next.js web application for employees to manage and view time off within their organization.

## Tech Stack

- Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- Convex (Database)
- Clerk (Authentication)

---

## Phase 1: Project Setup

### 1.1 Initialize Next.js Project

- [x] Create Next.js app with TypeScript and Tailwind CSS
- [x] Configure project structure using App Router

### 1.2 Set Up Convex

- [x] Install Convex dependencies
- [x] Initialize Convex project
- [x] Create convex/ directory with schema and functions

### 1.3 Set Up Clerk Authentication

- [x] Install Clerk Next.js SDK
- [x] Configure Clerk environment variables
- [x] Set up Clerk Provider in app layout
- [x] Create middleware for protected routes

### 1.4 Connect Clerk + Convex

- [x] Set up Clerk webhook to sync users to Convex on signup
- [x] Create Convex HTTP endpoint to receive webhook events
- [ ] Configure Clerk JWT template for Convex (requires Clerk dashboard setup)

---

## Phase 2: Database Schema (Convex)

### 2.1 Schema Definition

- [x] Create departments table
- [x] Create teams table (linked to departments)
- [x] Create users table (synced from Clerk)
- [x] Create timeOffEntries table

### 2.2 Seed Data

- [x] Create seed script for departments and teams
- [x] Sample departments: Engineering, Marketing, Sales, HR, Enterprise Digital
- [x] Sample teams per department

---

## Phase 3: Convex Functions

### 3.1 User Functions

- [x] createUser mutation
- [x] getCurrentUser query
- [x] updateUserProfile mutation
- [x] getUsersByDepartment query

### 3.2 Time Off Functions

- [x] addTimeOff mutation
- [x] removeTimeOff mutation
- [x] getMyTimeOff query
- [x] getTimeOffByDepartment query
- [x] getTimeOffByTeam query
- [x] getTimeOffByDateRange query

### 3.3 Reference Data Functions

- [x] getDepartments query
- [x] getTeams query

### 3.4 HTTP Endpoint

- [x] Clerk webhook handler for user creation

---

## Phase 4: Frontend Pages

### 4.1 Landing Page

- [x] Hero section with app description
- [x] "Get Started" button linking to sign-up

### 4.2 Authentication Pages

- [x] Sign-up page with Clerk components
- [x] Sign-in page with Clerk components

### 4.3 Onboarding Page

- [x] Department selection
- [x] Team selection
- [x] Title input
- [x] Save to Convex

### 4.4 Dashboard Page

- [x] Interactive calendar component
- [x] Team filter dropdown
- [x] Time off display per day
- [x] Click-to-expand modal for days with many users

### 4.5 My Time Off Page

- [x] Personal calendar to add/remove time off days
- [x] List view of scheduled time off
- [x] Click dates to toggle time off

---

## Phase 5: Components

### 5.1 Layout Components

- [x] Navbar with user menu
- [x] Dashboard layout

### 5.2 Calendar Components

- [x] CalendarView (monthly grid)
- [x] DayCell (individual day)
- [x] DateModal (full list popup)

### 5.3 Time Off Components

- [x] TeamFilter dropdown

---

## Phase 6: Integration & Polish

### 6.1 Clerk Webhook Setup

- [x] Create webhook endpoint in Convex
- [ ] Configure webhook in Clerk dashboard (manual step)
- [x] Handle user.created event

### 6.2 Protected Routes

- [x] Middleware for /dashboard/* routes
- [x] Redirect logic for auth and onboarding

### 6.3 Error Handling & Loading States

- [x] Loading skeletons
- [ ] Error handling (can be enhanced)
- [ ] Toast notifications (can be added later)

---

## Status: Implementation Complete

### Next Steps (Manual Configuration Required)

1. **Set up Clerk account** at https://clerk.com
   - Create a new application
   - Copy the API keys to `.env.local`

2. **Set up Convex account** at https://convex.dev
   - Run `npx convex dev` to initialize
   - Copy the deployment URL to `.env.local`

3. **Configure Clerk Webhook**
   - In Clerk Dashboard > Webhooks
   - Add endpoint: `https://your-convex-url.convex.cloud/clerk-webhook`
   - Subscribe to `user.created` and `user.updated` events

4. **Run the seed function**
   - After Convex is set up, run the seed function in Convex dashboard
   - Or call `seedDepartments` mutation to populate departments and teams

5. **Start the development server**
   ```bash
   npm run dev
   ```
