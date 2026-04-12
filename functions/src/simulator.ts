import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const simulateData = onSchedule('every 1 minutes', async (_event) => {
  const db = admin.database();
  
  // Update Gates
  const gates = ['A', 'B', 'C', 'D', 'E', 'F'];
  const gateUpdates: any = {};
  gates.forEach(gate => {
    const wait = Math.floor(Math.random() * 40);
    const status = wait < 15 ? 'low' : wait < 25 ? 'medium' : 'high';
    gateUpdates[`gates/${gate}`] = {
      name: `Gate ${gate}`,
      waitMinutes: wait,
      status,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };
  });

  // Update Sections (Heatmap)
  const sections = ['n1', 's1', 'e1', 'w1'];
  const labels: Record<string, string> = { n1: 'North', s1: 'South', e1: 'East', w1: 'West'};
  const sectionUpdates: any = {};
  sections.forEach(id => {
    const density = Math.floor(50 + Math.random() * 50); // density 50-100%
    sectionUpdates[`sections/${id}`] = {
      name: labels[id],
      capacity: 10000,
      currentCount: Math.floor(10000 * (density / 100)),
      density,
      updatedAt: admin.database.ServerValue.TIMESTAMP
    };
  });

  // Update Ticker
  const messages = [
    `Gate A wait time is down to ${Math.floor(Math.random() * 10) + 5} mins`,
    `Halftime starting in ${Math.floor(Math.random() * 20)} mins`,
    `Enjoy 20% off merch at Stand 2`,
    `Alert: Wet floor near Gate C`
  ];
  const tickerUpdate = messages.map(msg => ({
    text: msg,
    priority: 1,
    createdAt: Date.now()
  }));

  await db.ref('venue').update({
    ...gateUpdates,
    ...sectionUpdates,
    ticker: tickerUpdate
  });
  
  console.log('Successfully simulated realtime data update');
});
