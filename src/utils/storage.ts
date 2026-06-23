import type { User, Technician, Building, InspectionForm } from '../types'

const KEYS = {
  users: 'ict_users',
  technicians: 'ict_technicians',
  buildings: 'ict_buildings',
  inspections: 'ict_inspections',
  passwords: 'ict_passwords',
}

function get<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]') as T[]
  } catch {
    return []
  }
}

function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

// Users
export const getUsers = (): User[] => get<User>(KEYS.users)
export const saveUsers = (users: User[]): void => set(KEYS.users, users)
export const addUser = (user: User): void => saveUsers([...getUsers(), user])
export const updateUser = (user: User): void =>
  saveUsers(getUsers().map(u => u.id === user.id ? user : u))
export const deleteUser = (id: string): void =>
  saveUsers(getUsers().filter(u => u.id !== id))

// Technicians
export const getTechnicians = (): Technician[] => get<Technician>(KEYS.technicians)
export const saveTechnicians = (items: Technician[]): void => set(KEYS.technicians, items)
export const addTechnician = (item: Technician): void => saveTechnicians([...getTechnicians(), item])
export const updateTechnician = (item: Technician): void =>
  saveTechnicians(getTechnicians().map(t => t.id === item.id ? item : t))
export const deleteTechnician = (id: string): void =>
  saveTechnicians(getTechnicians().filter(t => t.id !== id))

// Buildings
export const getBuildings = (): Building[] => get<Building>(KEYS.buildings)
export const saveBuildings = (items: Building[]): void => set(KEYS.buildings, items)
export const addBuilding = (item: Building): void => saveBuildings([...getBuildings(), item])
export const updateBuilding = (item: Building): void =>
  saveBuildings(getBuildings().map(b => b.id === item.id ? item : b))
export const deleteBuilding = (id: string): void =>
  saveBuildings(getBuildings().filter(b => b.id !== id))
export const getBuildingById = (id: string): Building | undefined =>
  getBuildings().find(b => b.id === id)

// InspectionForms
export const getInspections = (): InspectionForm[] => get<InspectionForm>(KEYS.inspections)
export const saveInspections = (items: InspectionForm[]): void => set(KEYS.inspections, items)
export const addInspection = (item: InspectionForm): void => saveInspections([...getInspections(), item])
export const updateInspection = (item: InspectionForm): void =>
  saveInspections(getInspections().map(i => i.id === item.id ? item : i))
export const deleteInspection = (id: string): void =>
  saveInspections(getInspections().filter(i => i.id !== id))
export const getInspectionsByBuilding = (buildingId: string): InspectionForm[] =>
  getInspections().filter(i => i.buildingId === buildingId)

// Password management
export const getPasswords = (): Record<string, string> =>
  JSON.parse(localStorage.getItem(KEYS.passwords) || '{}') as Record<string, string>
export const setPassword = (username: string, password: string): void => {
  const passwords = getPasswords()
  passwords[username] = password
  localStorage.setItem(KEYS.passwords, JSON.stringify(passwords))
}
export const deletePassword = (username: string): void => {
  const passwords = getPasswords()
  delete passwords[username]
  localStorage.setItem(KEYS.passwords, JSON.stringify(passwords))
}

// Utility
export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
