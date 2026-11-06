import {
  BellIcon,
  BuildingIcon,
  CheckIcon,
  ClockIcon,
  LogoMark,
  PinIcon,
  SeatIcon,
  UsersIcon,
  ShieldIcon,
} from "./Icons";

export default function Hero() {
  return (
    <section className="hero-wrap" id="top">
      <div className="hero">
        {/* Top-left: notice card */}
        <div className="float f-notice" aria-hidden="true">
          <div className="notice">
            <PinIcon size={16} className="notice-pin" />
            <p className="notice-title">Exam day notice</p>
            <p>
              Carry your admit card and a valid college ID. Report to your hall
              30 minutes before the exam begins.
            </p>
          </div>
          <div className="tile tile-blue">
            <CheckIcon size={26} />
          </div>
        </div>

        {/* Top-right: schedule card */}
        <div className="float f-schedule" aria-hidden="true">
          <div className="tile tile-round">
            <ClockIcon size={26} />
          </div>
          <div className="panel">
            <div className="panel-head">
              <BellIcon size={16} />
              <span>Upcoming exam</span>
            </div>
            <p className="panel-title">Data Structures</p>
            <p className="panel-sub">Semester 3 · Theory paper</p>
            <span className="chip">
              <ClockIcon size={13} /> 10:00 – 13:00
            </span>
          </div>
        </div>

        {/* Center content */}
        <div className="hero-center">
          <div className="app-tile" aria-hidden="true">
            <LogoMark size={44} />
          </div>
          <h1>
            Find your exam seat,
            <span>all in one place</span>
          </h1>
          <p className="hero-sub">
            Check your hall, room and seat number in seconds. Download the app
            to keep your allocation and exam schedule on your phone.
          </p>
          <div className="hero-cta">
            <a href="#download" className="btn btn-primary">
              Download the app
            </a>
            <a href="#how-it-works" className="btn btn-ghost">
              How it works
            </a>
          </div>
        </div>

        {/* Bottom-left: seat card */}
        <div className="float f-seat" aria-hidden="true">
          <div className="panel panel-wide">
            <p className="panel-title sm">Your seat</p>
            <div className="seat-row">
              <div className="seat-badge">
                <SeatIcon size={16} />
              </div>
              <div className="seat-info">
                <p>Room B-204 · Seat 37</p>
                <div className="bar">
                  <i style={{ width: "100%" }} />
                </div>
              </div>
              <span className="seat-status">Confirmed</span>
            </div>
            <div className="seat-row">
              <div className="seat-badge seat-badge-alt">
                <BuildingIcon size={16} />
              </div>
              <div className="seat-info">
                <p>Block B · 2nd floor</p>
                <div className="bar">
                  <i style={{ width: "72%" }} />
                </div>
              </div>
              <span className="seat-meta">Hall 4</span>
            </div>
          </div>
        </div>

        {/* Bottom-right: coverage card */}
        <div className="float f-cover" aria-hidden="true">
          <div className="panel panel-wide">
            <p className="panel-title sm">Built for the exam cell</p>
            <div className="cover-tiles">
              <div className="mini">
                <UsersIcon size={22} />
                <span>Students</span>
              </div>
              <div className="mini mini-main">
                <ShieldIcon size={22} />
                <span>Verified</span>
              </div>
              <div className="mini">
                <BuildingIcon size={22} />
                <span>Halls</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
