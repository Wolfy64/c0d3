import React from 'react'
import { Link } from 'react-router-dom'
import { Mutation } from 'react-apollo'
import moment from 'moment'
import Markdown from 'react-markdown'

import {
  VIEW_SUBMISSION,
  APPROVE_SUBMISSION,
  REJECT_SUBMISSION,
  SUBMISSIONS,
  UNAPPROVE_SUBMISSION
} from '../../db/queries'
import StudentDiff from '../Student/StudentDiff'

const Undo = ({ mrInfo, submissionVar, lid }) => {
  if (mrInfo.status === 'passed') {
    return (
      <Mutation
        mutation={UNAPPROVE_SUBMISSION}
        variables={submissionVar}
        update={(cache, { data: { unapproveSubmission: { id } } }) => {
          const { submissions } = cache.readQuery({
            query: SUBMISSIONS,
            variables: { in: { id: lid } }
          })
          submissions.forEach(sub => {
            if (sub['id'] === id) sub['status'] = 'open'
          })
          cache.writeQuery({
            query: SUBMISSIONS,
            data: {
              submissions
            }
          })
        }}
      >
        {execute => (
          <h5>
            Reviewed
            <a target='_blank' rel='noopener noreferrer' onClick={execute}>
              {' '}
              Undo
            </a>
          </h5>
        )}
      </Mutation>
    )
  } else if (mrInfo.status === 'needMoreWork') {
    return <h5>Reviewed</h5>
  }
  return null
}

const MergeRequest = ({ lid, mrInfo }) => {
  let submissionVar = {
    in: {
      challengeId: mrInfo.challenge.id,
      lessonId: Number(lid),
      userId: mrInfo.user.id
    }
  }
  let comment
  const formattedCreatedAt = moment(mrInfo.createdAt).format('MMM Do h:mma')
  const formattedUpdatedAt = moment(mrInfo.updatedAt).fromNow()
  return (
    <div className='card-deck'>
      <div className='card mb-2 mt-1'>
        <div className='card-body pb-0 pl-4'>
          <div className='card-title'>
            <span className='h5'>
              <Link to={`/profile/${mrInfo.user.id}`}>
                {mrInfo.user.username}
              </Link>{' '}
              submitted challenge:
              <Mutation mutation={VIEW_SUBMISSION} variables={submissionVar}>
                {execute => (
                  <a
                    target='_blank'
                    rel='noopener noreferrer'
                    href={mrInfo.mrUrl}
                    onClick={execute}
                  >
                    {mrInfo.challenge.title}
                  </a>
                )}
              </Mutation>
            </span>
            <Undo mrInfo={mrInfo} submissionVar={submissionVar} lid={lid} />
          </div>
          <div className='card-text'>
            <h6 className='mt-2'>
              {` on ${formattedCreatedAt} | updated ${formattedUpdatedAt} `}
            </h6>
            <StudentDiff diff={mrInfo.diff} />
            <hr />
            {mrInfo.comment ? (
              <div>
                <h6>Comments</h6>
                <Markdown source={mrInfo.comment} />
                <hr />
              </div>
            ) : null}

            {mrInfo.status !== 'passed' && (
              <div className='form-group'>
                <label htmlFor='submission-comment'>
                  Add your comments to address here
                </label>
                <textarea
                  className='form-control rounded-0'
                  id='submission-comment'
                  rows='10'
                  ref={node => (comment = node)}
                />
              </div>
            )}
          </div>
        </div>
        {mrInfo.status !== 'passed' && (
          <span className='pl-3 pb-3'>
            <Mutation
              mutation={APPROVE_SUBMISSION}
              variables={submissionVar}
              update={(cache, { data: { approveSubmission: { id } } }) => {
                const { submissions } = cache.readQuery({
                  query: SUBMISSIONS,
                  variables: { in: { id: lid } }
                })
                submissions.forEach(sub => {
                  if (sub['id'] === id) sub['status'] = 'passed'
                })
                cache.writeQuery({
                  query: SUBMISSIONS,
                  data: {
                    submissions
                  }
                })
              }}
            >
              {execute => (
                <button className='btn btn-sm btn-success' onClick={execute}>
                  <i className='fa fa-thumbs-up mr-2' />
                  Approve Challenge
                </button>
              )}
            </Mutation>
            <Mutation mutation={REJECT_SUBMISSION}>
              {execute => (
                <button
                  className='btn btn-sm btn-dark'
                  onClick={() => {
                    submissionVar.in.comment = comment.value
                    execute({ variables: submissionVar })
                  }}
                >
                  <i className='fa fa-comment mr-2' />
                  Suggest Revision
                </button>
              )}
            </Mutation>
          </span>
        )}
      </div>
    </div>
  )
}

export default MergeRequest