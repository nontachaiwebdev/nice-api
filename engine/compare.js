const compareKeys = ['season', 'style', 'combi', 'materia_code', 'color_code', 'vendor']
const getKey = (dt) => compareKeys.map((k) => dt[k]).join(':')
const compareBomWithInet = (bomData, inetData) => {
    const bomResult = bomData.reduce((result, dt) => {
        const compareKey = getKey(dt)
        const matched = inetData.find((d) => {
            return getKey(d) === compareKey
        })
        const resultData = {...dt, key: compareKey}
        if(matched) 
            if(resultData.cons === matched.cons) {
                return {
                    ...result,
                    found: [...result.found, resultData]
                }
            } else {
                return {
                    ...result,
                    update: [...result.update, resultData]
                }
            }

        return {
            ...result,
            add: [...result.add, resultData]
        }
    }, { add: [], update: [], found: [] })
    const bomMatchedResult = [...bomResult.update, ...bomResult.found]
    const updateKeys = bomMatchedResult.map((dt) => dt.key)
    const inetResult = inetData.reduce((result, dt) => {
        const compareKey = getKey(dt)
        const matched = updateKeys.includes(compareKey)
        const resultData = {...dt, key: compareKey}
        if(matched) {
            if(resultData.cons === bomMatchedResult.find((b) => b.key === compareKey).cons) {
                return {
                    ...result,
                    found: [...result.found, resultData]
                }
            } else {
                return {
                    ...result,
                    update: [...result.update, resultData]
                }
            }
        }

        return {
            ...result,
            delete: [...result.delete, resultData]
        }
    }, { delete: [], update: [], found: [] })
    return {
        bomResult,
        inetResult
    }
}

const compareBomWithSap = (bomData, sapData) => {
    const bomResult = bomData.reduce((result, dt) => {
        const compareKey = getKey(dt)
        const matched = sapData.find((d) => {
            return getKey(d) === compareKey
        })
        const resultData = {...dt, key: compareKey}
        if(matched) 
            return {
                ...result,
                update: [...result.update, resultData]
            }

        return {
            ...result,
            add: [...result.add, resultData]
        }
    }, { add: [], update: [], found: [] })
    const updateKeys = bomResult.update.map((dt) => dt.key)
    const sapResult = sapData.reduce((result, dt) => {
        const compareKey = getKey(dt)
        const matched = updateKeys.includes(compareKey)
        const resultData = {...dt, key: compareKey}
        if(matched) 
            return {
                ...result,
                update: [...result.update, resultData]
            }

        return {
            ...result,
            delete: [...result.delete, resultData]
        }
    }, { delete: [], update: [], found: [] })
    return {
        bomResult,
        sapResult
    }
}

module.exports = {
    compareBomWithInet,
    compareBomWithSap
}