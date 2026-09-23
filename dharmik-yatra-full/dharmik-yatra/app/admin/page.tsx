'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSupabaseBrowser } from '@/lib/supabase-browser'

type Booking = {
  id: string
  booking_code: string
  customer_name: string
  phone: string
  passengers: number
  pickup_point: string
  amount: number
  advance_paid: number
  payment_status: string
  booking_status: string
  created_at: string
  trips?: { title: string } | null
}

type Trip = {
  id: string
  title: string
  slug: string
  description: string | null
  destination: string | null
  duration: string | null
  price: number
  is_published: boolean
  created_at?: string
}

type TripForm = {
  title: string
  slug: string
  description: string
  destination: string
  duration: string
  price: string
  is_published: boolean
}

const emptyTrip: TripForm = {
  title: '',
  slug: '',
  description: '',
  destination: '',
  duration: '',
  price: '',
  is_published: true,
}

export default function Admin() {
  const sb = getSupabaseBrowser()

  const [user, setUser] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [trips, setTrips] = useState<Trip[]>([])

  const [activeTab, setActiveTab] = useState<'bookings' | 'trips'>('bookings')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [loading, setLoading] = useState(false)
  const [tripLoading, setTripLoading] = useState(false)

  const [showTripForm, setShowTripForm] = useState(false)
  const [editingTripId, setEditingTripId] = useState<string | null>(null)

  const [tripForm, setTripForm] = useState<TripForm>(emptyTrip)

  /* =====================================================
     LOAD DATA
     ===================================================== */

  async function load() {
    if (!sb) return

    setError('')

    const {
      data: { user },
    } = await sb.auth.getUser()

    setUser(user)

    if (!user) return

    const bookingResult = await sb
      .from('bookings')
      .select('*,trips(title)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (bookingResult.error) {
      setError(bookingResult.error.message)
    } else {
      setBookings((bookingResult.data || []) as Booking[])
    }

    const tripResult = await sb
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })

    if (tripResult.error) {
      setError(tripResult.error.message)
    } else {
      setTrips((tripResult.data || []) as Trip[])
    }
  }

  useEffect(() => {
    load()
  }, [])

  /* =====================================================
     LOGIN
     ===================================================== */

  async function login(e: React.FormEvent) {
    e.preventDefault()

    if (!sb) return

    setError('')
    setLoading(true)

    const result = await sb.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    await load()
  }

  /* =====================================================
     LOGOUT
     ===================================================== */

  async function logout() {
    await sb?.auth.signOut()

    setUser(null)
    setBookings([])
    setTrips([])
  }

  /* =====================================================
     TRIP FORM HELPERS
     ===================================================== */

  function makeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  function updateTripField(
    field: keyof TripForm,
    value: string | boolean
  ) {
    setTripForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  function startAddTrip() {
    setEditingTripId(null)
    setTripForm(emptyTrip)
    setError('')
    setSuccess('')
    setShowTripForm(true)
  }

  function startEditTrip(trip: Trip) {
    setEditingTripId(trip.id)

    setTripForm({
      title: trip.title || '',
      slug: trip.slug || '',
      description: trip.description || '',
      destination: trip.destination || '',
      duration: trip.duration || '',
      price: String(trip.price ?? ''),
      is_published: trip.is_published ?? true,
    })

    setError('')
    setSuccess('')
    setShowTripForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function cancelTripForm() {
    setShowTripForm(false)
    setEditingTripId(null)
    setTripForm(emptyTrip)
    setError('')
  }

  /* =====================================================
     CREATE / UPDATE TRIP
     ===================================================== */

  async function saveTrip(e: React.FormEvent) {
    e.preventDefault()

    if (!sb) return

    setError('')
    setSuccess('')
    setTripLoading(true)

    if (!tripForm.title.trim()) {
      setError('Trip title is required.')
      setTripLoading(false)
      return
    }

    if (!tripForm.destination.trim()) {
      setError('Destination is required.')
      setTripLoading(false)
      return
    }

    const price = Number(tripForm.price)

    if (Number.isNaN(price) || price < 0) {
      setError('Please enter a valid price.')
      setTripLoading(false)
      return
    }

    const payload = {
      title: tripForm.title.trim(),
      slug: tripForm.slug.trim() || makeSlug(tripForm.title),
      description: tripForm.description.trim() || null,
      destination: tripForm.destination.trim(),
      duration: tripForm.duration.trim() || null,
      price,
      is_published: tripForm.is_published,
    }

    let result

    if (editingTripId) {
      result = await sb
        .from('trips')
        .update(payload)
        .eq('id', editingTripId)
    } else {
      result = await sb
        .from('trips')
        .insert(payload)
    }

    setTripLoading(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess(
      editingTripId
        ? 'Trip updated successfully.'
        : 'Trip created successfully.'
    )

    setShowTripForm(false)
    setEditingTripId(null)
    setTripForm(emptyTrip)

    await load()
  }

  /* =====================================================
     DELETE TRIP
     ===================================================== */

  async function deleteTrip(trip: Trip) {
    if (!sb) return

    const confirmed = window.confirm(
      `Delete "${trip.title}"?\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    setError('')
    setSuccess('')

    const result = await sb
      .from('trips')
      .delete()
      .eq('id', trip.id)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess('Trip deleted successfully.')

    await load()
  }

  /* =====================================================
     PUBLISH / UNPUBLISH
     ===================================================== */

  async function togglePublished(trip: Trip) {
    if (!sb) return

    setError('')
    setSuccess('')

    const result = await sb
      .from('trips')
      .update({
        is_published: !trip.is_published,
      })
      .eq('id', trip.id)

    if (result.error) {
      setError(result.error.message)
      return
    }

    setSuccess(
      trip.is_published
        ? 'Trip unpublished.'
        : 'Trip published.'
    )

    await load()
  }

  /* =====================================================
     SUPABASE SETUP CHECK
     ===================================================== */

  if (!sb) {
    return (
      <main>
        <div className="container pagePad">
          <h1 className="pageTitle">
            Admin setup required
          </h1>

          <p className="lead">
            Add Supabase environment variables first.
          </p>
        </div>
      </main>
    )
  }

  /* =====================================================
     LOGIN SCREEN
     ===================================================== */

  if (!user) {
    return (
      <main>
        <div className="container pagePad">
          <Link href="/">← Home</Link>

          <div className="form narrow">
            <div className="eyebrow">
              Private dashboard
            </div>

            <h1 className="pageTitle small">
              Admin Login
            </h1>

            <form onSubmit={login}>
              <div className="field">
                <label>Email</label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                />
              </div>

              <div className="field">
                <label>Password</label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              <button
                className="btn primary fullBtn"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  /* =====================================================
     ADMIN DASHBOARD
     ===================================================== */

  return (
    <main>
      <div className="container pagePad">

        {/* HEADER */}

        <div className="adminTop">
          <div>
            <div className="eyebrow">
              Dharmik Yatra
            </div>

            <h1 className="pageTitle small">
              Admin Dashboard
            </h1>
          </div>

          <button
            className="btn secondary"
            onClick={logout}
          >
            Logout
          </button>
        </div>

        {/* TABS */}

        <div className="adminTabs">
          <button
            className={
              activeTab === 'bookings'
                ? 'btn primary'
                : 'btn secondary'
            }
            onClick={() => {
              setActiveTab('bookings')
              setSuccess('')
              setError('')
            }}
          >
            Bookings
          </button>

          <button
            className={
              activeTab === 'trips'
                ? 'btn primary'
                : 'btn secondary'
            }
            onClick={() => {
              setActiveTab('trips')
              setSuccess('')
              setError('')
            }}
          >
            Trips
          </button>
        </div>

        {/* GLOBAL MESSAGES */}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {success && (
          <div className="success">
            {success}
          </div>
        )}

        {/* =================================================
            BOOKINGS
           ================================================= */}

        {activeTab === 'bookings' && (
          <>
            <div className="stats">
              <div>
                <span>Bookings</span>

                <strong>
                  {bookings.length}
                </strong>
              </div>

              <div>
                <span>Passengers</span>

                <strong>
                  {bookings.reduce(
                    (a, b) => a + b.passengers,
                    0
                  )}
                </strong>
              </div>

              <div>
                <span>Booking value</span>

                <strong>
                  ₹
                  {bookings
                    .reduce(
                      (a, b) => a + (b.amount || 0),
                      0
                    )
                    .toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="tableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Booking</th>
                    <th>Customer</th>
                    <th>Trip</th>
                    <th>People</th>
                    <th>Pickup</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <strong>
                          {b.booking_code}
                        </strong>

                        <br />

                        <small>
                          {new Date(
                            b.created_at
                          ).toLocaleString('en-IN')}
                        </small>
                      </td>

                      <td>
                        {b.customer_name}
                        <br />
                        {b.phone}
                      </td>

                      <td>
                        {b.trips?.title || '—'}
                      </td>

                      <td>
                        {b.passengers}
                      </td>

                      <td>
                        {b.pickup_point}
                      </td>

                      <td>
                        ₹
                        {(b.amount || 0).toLocaleString(
                          'en-IN'
                        )}
                      </td>

                      <td>
                        <span className="pill">
                          {b.booking_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* =================================================
            TRIPS
           ================================================= */}

        {activeTab === 'trips' && (
          <>
            <div className="adminSectionHeader">
              <div>
                <h2>Trips</h2>

                <p>
                  Create and manage the yatras shown on
                  your website.
                </p>
              </div>

              <button
                className="btn primary"
                onClick={startAddTrip}
              >
                + Add Trip
              </button>
            </div>

            {/* TRIP FORM */}

            {showTripForm && (
              <div className="adminEditor">
                <div className="adminEditorHeader">
                  <div>
                    <div className="eyebrow">
                      {editingTripId
                        ? 'Edit Trip'
                        : 'New Trip'}
                    </div>

                    <h2>
                      {editingTripId
                        ? 'Update Yatra'
                        : 'Create Yatra'}
                    </h2>
                  </div>

                  <button
                    className="btn secondary"
                    type="button"
                    onClick={cancelTripForm}
                  >
                    Cancel
                  </button>
                </div>

                <form
                  className="form"
                  onSubmit={saveTrip}
                >
                  <div className="formGrid">

                    <div className="field full">
                      <label>
                        Trip Title *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="Golu Devta, Kainchi Dham & Mukteshwar"
                        value={tripForm.title}
                        onChange={(e) => {
                          const title =
                            e.target.value

                          updateTripField(
                            'title',
                            title
                          )

                          if (!editingTripId) {
                            setTripForm((previous) => ({
                              ...previous,
                              title,
                              slug: makeSlug(title),
                            }))
                          }
                        }}
                      />
                    </div>

                    <div className="field">
                      <label>
                        Slug
                      </label>

                      <input
                        type="text"
                        placeholder="golu-kainchi-mukteshwar"
                        value={tripForm.slug}
                        onChange={(e) =>
                          updateTripField(
                            'slug',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="field">
                      <label>
                        Destination *
                      </label>

                      <input
                        type="text"
                        required
                        placeholder="Uttarakhand"
                        value={tripForm.destination}
                        onChange={(e) =>
                          updateTripField(
                            'destination',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="field">
                      <label>
                        Duration
                      </label>

                      <input
                        type="text"
                        placeholder="1 Day / 1 Night"
                        value={tripForm.duration}
                        onChange={(e) =>
                          updateTripField(
                            'duration',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="field">
                      <label>
                        Price per person *
                      </label>

                      <input
                        type="number"
                        min="0"
                        required
                        placeholder="1850"
                        value={tripForm.price}
                        onChange={(e) =>
                          updateTripField(
                            'price',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="field full">
                      <label>
                        Description
                      </label>

                      <textarea
                        placeholder="Describe the yatra, destinations, food, transport and other details..."
                        value={tripForm.description}
                        onChange={(e) =>
                          updateTripField(
                            'description',
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="field full">
                      <label className="checkboxField">
                        <input
                          type="checkbox"
                          checked={
                            tripForm.is_published
                          }
                          onChange={(e) =>
                            updateTripField(
                              'is_published',
                              e.target.checked
                            )
                          }
                        />

                        <span>
                          Publish this trip on
                          the website
                        </span>
                      </label>
                    </div>

                  </div>

                  <button
                    className="btn primary"
                    type="submit"
                    disabled={tripLoading}
                  >
                    {tripLoading
                      ? 'Saving...'
                      : editingTripId
                        ? 'Save Changes'
                        : 'Create Trip'}
                  </button>
                </form>
              </div>
            )}

            {/* TRIP TABLE */}

            <div className="tableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Trip</th>
                    <th>Destination</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {trips.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          textAlign: 'center',
                          padding: '35px',
                        }}
                      >
                        No trips found.
                        <br />
                        <br />
                        Click
                        <strong>
                          {' '}
                          + Add Trip{' '}
                        </strong>
                        to create your first yatra.
                      </td>
                    </tr>
                  )}

                  {trips.map((trip) => (
                    <tr key={trip.id}>
                      <td>
                        <strong>
                          {trip.title}
                        </strong>

                        <br />

                        <small>
                          /{trip.slug}
                        </small>
                      </td>

                      <td>
                        {trip.destination || '—'}
                      </td>

                      <td>
                        {trip.duration || '—'}
                      </td>

                      <td>
                        ₹
                        {Number(
                          trip.price || 0
                        ).toLocaleString('en-IN')}
                      </td>

                      <td>
                        <span
                          className={
                            trip.is_published
                              ? 'pill'
                              : 'pill unpublished'
                          }
                        >
                          {trip.is_published
                            ? 'Published'
                            : 'Draft'}
                        </span>
                      </td>

                      <td>
                        <div className="adminActions">

                          <button
                            className="btn secondary"
                            onClick={() =>
                              startEditTrip(trip)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="btn secondary"
                            onClick={() =>
                              togglePublished(trip)
                            }
                          >
                            {trip.is_published
                              ? 'Unpublish'
                              : 'Publish'}
                          </button>

                          <button
                            className="btn dangerBtn"
                            onClick={() =>
                              deleteTrip(trip)
                            }
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </main>
  )
}
