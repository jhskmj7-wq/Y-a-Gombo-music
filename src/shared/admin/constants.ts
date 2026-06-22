export const SUPER_FOUNDERS = [
  "jhs.kmj7@gmail.com",
  "Johnsylvesterh@gmail.com"
];

export const isSuperFounder = (email?: string) => {
  return email && SUPER_FOUNDERS.includes(email);
};
