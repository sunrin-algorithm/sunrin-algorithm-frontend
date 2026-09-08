import { CONTEST } from '../content'
import Section from './Section'
import contestPhoto from '../assets/contest.jpg'

export default function Contest() {
  return (
    <Section id="contest" label="천코대">
      <h2 className="contest-title">
        <span className="line">
          <span className="line-i">
            <em>{CONTEST.titleHead}</em>
          </span>
        </span>
        <span className="line">
          <span className="line-i">{CONTEST.titleTail}</span>
        </span>
      </h2>

      <div className="contest-cols">
        <div className="contest-text">
          {CONTEST.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="contest-side">
          <figure className="contest-photo">
            <img src={contestPhoto} alt="천하제일 코딩대회 현장" loading="lazy" />
            <figcaption className="pixel">{CONTEST.photoCaption}</figcaption>
          </figure>

          <ul className="contest-facts pixel">
            {CONTEST.facts.map(([k, v]) => (
              <li key={k}>
                <span>{k}</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
