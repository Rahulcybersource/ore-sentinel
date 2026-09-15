export interface IsroTimeSeriesData {
  timestamp: number;
  value: number;
  dateStr: string;
}

export interface IsroSatelliteAdapter {
  getNdviTimeSeries(lat: number, lng: number, fromTime?: string, toTime?: string): Promise<IsroTimeSeriesData[]>;
  getVegetationIndex(lat: number, lng: number, param: string, fromTime?: string, toTime?: string): Promise<IsroTimeSeriesData[]>;
  getTimestamps(service: string): Promise<any[]>;
}

export class LiveIsroSatelliteAdapter implements IsroSatelliteAdapter {
  private baseUrl = 'http://localhost:4000/api/isro';

  async getNdviTimeSeries(lat: number, lng: number, fromTime = '20230101', toTime = '20231231'): Promise<IsroTimeSeriesData[]> {
    const res = await fetch(`${this.baseUrl}/ndvi?lat=${lat}&lng=${lng}&fromTime=${fromTime}&toTime=${toTime}`);
    if (!res.ok) throw new Error('Failed to fetch ISRO NDVI');
    
    const data = await res.json();
    return this.processChartData(data.result || []);
  }

  async getVegetationIndex(lat: number, lng: number, param: string, fromTime = '20230101', toTime = '20231231'): Promise<IsroTimeSeriesData[]> {
    const res = await fetch(`${this.baseUrl}/vegetation-index?lat=${lat}&lng=${lng}&param=${param}&fromTime=${fromTime}&toTime=${toTime}`);
    if (!res.ok) throw new Error(`Failed to fetch ISRO ${param}`);
    
    const data = await res.json();
    return this.processChartData(data.result || []);
  }

  async getTimestamps(service: string): Promise<any[]> {
    const res = await fetch(`${this.baseUrl}/timestamps?service=${service}`);
    if (!res.ok) throw new Error('Failed to fetch timestamps');
    
    const data = await res.json();
    // Assuming the response structure is { result: { datasetId: [...] } }
    const datasetId = Object.keys(data.result || {})[0];
    if (!datasetId) return [];
    
    return data.result[datasetId].map((dt: string) => {
       const datePart = dt.split(' ')[0];
       const year = datePart.substring(0, 4);
       const month = datePart.substring(4, 6);
       const day = datePart.substring(6, 8);
       return { val: datePart, lbl: `${year}-${month}-${day}` };
    });
  }

  private processChartData(rawData: any[]): IsroTimeSeriesData[] {
    return rawData.map(entry => {
      const [dateStr, value] = entry;
      const timestamp = new Date(dateStr).getTime();
      const val = Array.isArray(value) ? value[0] : value;
      return {
        timestamp,
        value: val !== null ? val : 0,
        dateStr: new Date(dateStr).toLocaleDateString()
      };
    }).sort((a, b) => a.timestamp - b.timestamp);
  }
}

export class MockIsroSatelliteAdapter implements IsroSatelliteAdapter {
  async getNdviTimeSeries(_lat: number, _lng: number, _fromTime?: string, _toTime?: string): Promise<IsroTimeSeriesData[]> {
    return this.generateMockData(0.2, 0.8);
  }

  async getVegetationIndex(_lat: number, _lng: number, _param: string, _fromTime?: string, _toTime?: string): Promise<IsroTimeSeriesData[]> {
    return this.generateMockData(-0.5, 0.5);
  }

  async getTimestamps(_service: string): Promise<any[]> {
    return [
      { val: '20231201', lbl: '2023-12-01' },
      { val: '20231101', lbl: '2023-11-01' }
    ];
  }

  private generateMockData(min: number, max: number): IsroTimeSeriesData[] {
    const data: IsroTimeSeriesData[] = [];
    let now = new Date('2023-01-01').getTime();
    for (let i = 0; i < 12; i++) {
      data.push({
        timestamp: now,
        value: min + Math.random() * (max - min),
        dateStr: new Date(now).toLocaleDateString()
      });
      now += 30 * 24 * 60 * 60 * 1000;
    }
    return data;
  }
}
