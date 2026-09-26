import {
  formatClock,
  formatDistance,
  formatHeartRate,
  formatPaceShort,
  formatPower,
  formatSpeed,
} from "../utils/format.js";

function speedCell(lap, group) {
  if (group === "ride") return formatSpeed(lap.average_speed);
  if (group === "swim") return formatPaceShort(lap.average_speed, 100);
  return formatPaceShort(lap.average_speed);
}

const SPEED_HEADER = { ride: "Velocidad", swim: "Ritmo /100 m" };

export default function LapsTable({ laps, group, showPower }) {
  const hasHeartRate = laps.some((lap) => lap.average_heartrate);

  return (
    <section className="section card">
      <h2>Vueltas</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Distancia</th>
              <th>Tiempo</th>
              <th>{SPEED_HEADER[group] ?? "Ritmo"}</th>
              {hasHeartRate && <th>FC</th>}
              {showPower && <th>Potencia</th>}
            </tr>
          </thead>
          <tbody>
            {laps.map((lap, index) => (
              <tr key={lap.id}>
                <td>{index + 1}</td>
                <td>{formatDistance(lap.distance)}</td>
                <td>{formatClock(lap.moving_time)}</td>
                <td>{speedCell(lap, group)}</td>
                {hasHeartRate && (
                  <td>
                    {lap.average_heartrate
                      ? formatHeartRate(lap.average_heartrate)
                      : "—"}
                  </td>
                )}
                {showPower && (
                  <td>
                    {lap.average_watts ? formatPower(lap.average_watts) : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
