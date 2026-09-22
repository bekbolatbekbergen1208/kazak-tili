/** Display the supplied artwork through two viewports without changing its pixels. */
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="logo qd-brand-logo" role="img" aria-label="QazaqDos">
      <svg className="qd-brand-symbol" viewBox="315 185 625 605" width="42" height="41" aria-hidden="true" focusable="false">
        <image href="/qazaqdos-logo.png" width="1254" height="1254" />
      </svg>
      {!small && (
        <svg className="qd-brand-wordmark" viewBox="65 820 1120 230" width="132" height="28" aria-hidden="true" focusable="false">
          <image href="/qazaqdos-logo.png" width="1254" height="1254" />
        </svg>
      )}
    </div>
  );
}

export function Mascot({className=""}:{className?:string}){return <img className={`mascot ${className}`} src="/dossha.png" alt="Досжан — виртуалды дос"/>}
