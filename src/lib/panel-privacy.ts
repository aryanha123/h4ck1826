export function canReadPanelMessages(privateMode: boolean | null | undefined) {
  return privateMode !== true;
}