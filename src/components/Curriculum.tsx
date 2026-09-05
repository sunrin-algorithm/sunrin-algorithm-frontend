import { CURRICULUM } from '../content'
import DpGrid from './DpGrid'
import Section from './Section'

export default function Curriculum() {
  return (
    <Section
      id="curriculum"
      n="03"
      label="커리큘럼"
      bleed={
        <div className="curriculum-table">
          <DpGrid rows={CURRICULUM.rows} cols={CURRICULUM.cols} cells={CURRICULUM.cells} />
          <p className="curriculum-note">{CURRICULUM.note}</p>
        </div>
      }
    >
      <p className="about-lead line">
        <span className="line-i">
          C++ 문법에서 시작해 자료구조를 쌓고, 그 위에서 알고리즘 이론과 기출 문제로 넘어갑니다.
        </span>
      </p>
    </Section>
  )
}
