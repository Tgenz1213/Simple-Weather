import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ForecastRaw } from '../components/ForecastRaw'

describe('ForecastRaw', () => {
  it('renders JSON data and shows source label', () => {
    const data = { foo: 'bar', nested: { n: 1 } }
    render(<ForecastRaw source="remote" data={data} />)

    expect(screen.getByText(/fetched: remote/i)).toBeInTheDocument()
    expect(screen.getByText(/"foo": "bar"/i)).toBeInTheDocument()
    expect(screen.getByText(/"n": 1/)).toBeInTheDocument()
  })
})
