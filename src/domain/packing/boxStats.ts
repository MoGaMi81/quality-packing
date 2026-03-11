export type BoxStats = {
  smallBoxes: number;
  largeBoxes: number;
  totalBoxes: number;
};

export function calculateBoxStats(lines: any[]): BoxStats {

  const boxesMap = new Map<number, number>();

  for (const l of lines) {

    const boxNo = Number(l.box_no);
    const pounds = Number(l.pounds) || 0;

    if (!boxesMap.has(boxNo)) {
      boxesMap.set(boxNo, 0);
    }

    boxesMap.set(
      boxNo,
      boxesMap.get(boxNo)! + pounds
    );
  }

  let smallBoxes = 0;
  let largeBoxes = 0;

  boxesMap.forEach((totalLbs) => {

    if (totalLbs < 70) smallBoxes++;
    else largeBoxes++;

  });

  return {
    smallBoxes,
    largeBoxes,
    totalBoxes: boxesMap.size,
  };
}