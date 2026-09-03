export function Logo({small=false}:{small?:boolean}){return <div className="logo"><span className="logoMark">Q</span>{!small&&<span>Qazaq<span className="orange">Dos</span></span>}</div>}
export function Mascot({className=""}:{className?:string}){return <img className={`mascot ${className}`} src="/dossha.png" alt="Досша — виртуалды дос"/>}
