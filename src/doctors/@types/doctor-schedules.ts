export interface ScheduleDetails {
  start: string;
  end: string;
}

export interface DoctorSchedules {
  morningSchedule?: ScheduleDetails[];
  afternoonSchedule?: ScheduleDetails[];
}
