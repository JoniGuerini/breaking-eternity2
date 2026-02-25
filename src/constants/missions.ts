export type MissionObjectiveType =
    | "OWN_GENERATOR"
    | "TOTAL_FRAGMENTS_LIFETIME"
    | "UPGRADE_LEVEL"
    | "GLOBAL_UPGRADE_LEVEL"

export type MissionRewardType = "UPGRADE_POINTS" | "FRAGMENTS"

export interface Mission {
    id: string
    type: MissionObjectiveType
    targetAmount: number
    generatorIndex?: number // Required for OWN_GENERATOR and UPGRADE_LEVEL
    rewardType: MissionRewardType
    rewardAmount: number
}

const BASE_MISSIONS: Mission[] = [
    { id: "m_first_gen", type: "OWN_GENERATOR", generatorIndex: 0, targetAmount: 10, rewardType: "UPGRADE_POINTS", rewardAmount: 5 },
    { id: "m_second_gen", type: "OWN_GENERATOR", generatorIndex: 1, targetAmount: 1, rewardType: "UPGRADE_POINTS", rewardAmount: 10 },
    { id: "m_fragments_100", type: "TOTAL_FRAGMENTS_LIFETIME", targetAmount: 100, rewardType: "FRAGMENTS", rewardAmount: 200 },
    { id: "m_upgrade_1", type: "UPGRADE_LEVEL", generatorIndex: 0, targetAmount: 3, rewardType: "UPGRADE_POINTS", rewardAmount: 5 },
    { id: "m_fragments_1000", type: "TOTAL_FRAGMENTS_LIFETIME", targetAmount: 1000, rewardType: "UPGRADE_POINTS", rewardAmount: 15 },
    { id: "m_third_gen", type: "OWN_GENERATOR", generatorIndex: 2, targetAmount: 1, rewardType: "UPGRADE_POINTS", rewardAmount: 20 },
    { id: "m_global_prod_1", type: "GLOBAL_UPGRADE_LEVEL", targetAmount: 1, rewardType: "FRAGMENTS", rewardAmount: 10000 },
    { id: "m_fragments_1m", type: "TOTAL_FRAGMENTS_LIFETIME", targetAmount: 1000000, rewardType: "UPGRADE_POINTS", rewardAmount: 50 },
    { id: "m_tenth_gen", type: "OWN_GENERATOR", generatorIndex: 9, targetAmount: 1, rewardType: "UPGRADE_POINTS", rewardAmount: 100 },
    { id: "m_fragments_1b", type: "TOTAL_FRAGMENTS_LIFETIME", targetAmount: 1000000000, rewardType: "UPGRADE_POINTS", rewardAmount: 250 },
]

const generatedMissions: Mission[] = []
const addedObjectives = new Set<string>()

const getObjectiveKey = (m: Mission) => `${m.type}_${m.generatorIndex ?? "N"}_${m.targetAmount}`

// Register base missions first
BASE_MISSIONS.forEach(m => addedObjectives.add(getObjectiveKey(m)))

const addMission = (m: Mission) => {
    const key = getObjectiveKey(m)
    if (!addedObjectives.has(key)) {
        addedObjectives.add(key)
        generatedMissions.push(m)
    }
}

const GENERATOR_THRESHOLDS = [1, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000]
const UPGRADE_THRESHOLDS = [1, 5, 10, 25, 50, 100, 250, 500]
const GLOBAL_THRESHOLDS = [1, 5, 10, 25, 50, 100]

// 26 Generators total
for (let g = 0; g < 26; g++) {
    for (const t of GENERATOR_THRESHOLDS) {
        // Reward scales with generator tier and amount
        let reward = 5 + (g * 5)
        if (t >= 10) reward += 5
        if (t >= 100) reward += 20
        if (t >= 1000) reward += 50

        addMission({
            id: `m_gen_${g}_qty_${t}`,
            type: "OWN_GENERATOR",
            generatorIndex: g,
            targetAmount: t,
            rewardType: "UPGRADE_POINTS",
            rewardAmount: reward,
        })
    }

    for (const t of UPGRADE_THRESHOLDS) {
        let reward = 10 + (g * 10) + (t * 2)
        addMission({
            id: `m_upg_${g}_lvl_${t}`,
            type: "UPGRADE_LEVEL",
            generatorIndex: g,
            targetAmount: t,
            rewardType: "UPGRADE_POINTS",
            rewardAmount: reward,
        })
    }
}

for (const t of GLOBAL_THRESHOLDS) {
    addMission({
        id: `m_global_prod_lvl_${t}`,
        type: "GLOBAL_UPGRADE_LEVEL",
        targetAmount: t,
        rewardType: "UPGRADE_POINTS",
        rewardAmount: 50 * t,
    })
}

// Fragment powers of 10 from 1e2 up to 1e30
for (let exp = 2; exp <= 30; exp++) {
    const amount = Math.pow(10, exp)
    addMission({
        id: `m_frag_total_1e${exp}`,
        type: "TOTAL_FRAGMENTS_LIFETIME",
        targetAmount: amount,
        rewardType: "UPGRADE_POINTS",
        rewardAmount: 10 * exp,
    })
}

export const MISSIONS: Mission[] = [...BASE_MISSIONS, ...generatedMissions]
