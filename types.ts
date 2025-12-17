
export interface EventData {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  drawDate: string;
  value: number;
  prize: string;
  initialSeq: number;
  finalSeq: number;
  createdAt: number;
  headerImage?: string; // Imagem em base64
}

export interface RaffleSlot {
  number: number;
  value: number;
  prize: string;
}
