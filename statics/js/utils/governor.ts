export function voteState(state: number) {
  const code = Number(state)
  switch (code) {
    case 1:
      return { text: '同意票', code }
    case 0:
      return { text: '反对票', code }
    case 2:
      return { text: '弃权票', code }
    default:
      return { text: '未设定', code }
  }
}

export function proposalState(state: number) {
  const code = Number(state)
  switch (code) {
    case 0:
      return { text: '未开始', en: 'Pending', emoji: '⚪', code }
    case 1:
      return { text: '投票中', en: 'Active', emoji: '🔵', code }
    case 2:
      return { text: '已取消', en: 'Canceled', emoji: '❌', code }
    case 3:
      return { text: '不通过', en: 'Defeated', emoji: '🔴', code }
    case 4:
      return { text: '投票通过', en: 'Succeeded', emoji: '🟢', code }
    case 5:
      return { text: '已排程', en: 'Queued', emoji: '⏸', code }
    case 6:
      return { text: '已过期', en: 'Expired', emoji: '➖', code }
    case 7:
      return { text: '已执行', en: 'Executed', emoji: '✅', code }
    default:
      return { text: '', en: '', emoji: '', code }
  }
}
