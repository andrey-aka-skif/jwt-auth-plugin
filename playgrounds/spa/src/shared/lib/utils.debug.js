/**
 * Имитация длительного действия
 * @param { Number } duration Длительность имитации
 * @returns
 */
export const longActionImitation = async (duration = 2000) => {
  return new Promise(_ => setTimeout(_, duration))
}
