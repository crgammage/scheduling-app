"use client";

import { Doc } from "../../../convex/_generated/dataModel";

interface TeamFilterProps {
  teams: Doc<"teams">[];
  selectedTeamId: string;
  onTeamChange: (teamId: string) => void;
}

export function TeamFilter({ teams, selectedTeamId, onTeamChange }: TeamFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="team-filter" className="text-sm font-medium text-gray-700">
        Filter by team:
      </label>
      <select
        id="team-filter"
        value={selectedTeamId}
        onChange={(e) => onTeamChange(e.target.value)}
        className="block w-48 px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Teams</option>
        {teams.map((team) => (
          <option key={team._id} value={team._id}>
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}
