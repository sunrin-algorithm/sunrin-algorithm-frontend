import { FAQ } from '../content'
import Section from './Section'

export default function Faq() {
  return (
    <Section id="faq" label="FAQ">
      <p className="about-lead line">
        <span className="line-i">자주 묻는 질문.</span>
      </p>

      <dl className="faq-list">
        {FAQ.map((item, i) => (
          <div className="faq-item" key={i}>
            <dt className="faq-q pixel">{item.q}</dt>
            <dd className="faq-a">{item.a}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
